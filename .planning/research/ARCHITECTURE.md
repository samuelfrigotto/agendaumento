# Architecture Patterns

**Domain:** Veterinary clinic appointment scheduling (single vet, single clinic)
**Researched:** 2026-04-14
**Confidence:** HIGH (schema patterns from authoritative sources; dual auth and queue patterns from official docs)

---

## System Overview

The system has two distinct user surfaces sharing one backend:

- **Client surface** — mobile-first Angular SPA, self-service booking
- **Admin surface** — Angular SPA (same build), full schedule control

Both surfaces hit the same Express REST API. The API owns all business logic. PostgreSQL is the single source of truth. Async notifications (WhatsApp + email) flow through a job queue, never blocking the HTTP response.

---

## Component Map

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (VPS)                         │
│  /api/*  → Express backend (Docker)                         │
│  /*      → Angular static files                             │
└────────────┬───────────────────────────────────────────────-┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express REST API                          │
│                                                             │
│  Auth Module         Scheduling Module    Notification      │
│  ├─ /auth/admin/*    ├─ /services         Module            │
│  └─ /auth/client/*  ├─ /availability     ├─ Queue producer  │
│                     ├─ /appointments     │  (on booking)    │
│  Client Module      └─ /blocked-dates    └─ Queue worker    │
│  ├─ /clients/*                              (WhatsApp+email) │
│  └─ /pets/*                                                  │
│                                                             │
│  Admin Module                                               │
│  └─ /admin/*                                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
   PostgreSQL            Redis (job queue)
   (primary data)        (BullMQ backing store)
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Notes |
|-----------|---------------|-------------------|-------|
| Nginx | TLS termination, static file serving, API reverse proxy | Express API, filesystem | Already in existing deploy infra |
| Angular SPA | Render client and admin UIs, route by user role | Express API (HTTP) | One build, two route trees (/admin/*, /app/*) |
| Auth Module | Issue JWTs, validate credentials for both user types | PostgreSQL | Separate login endpoints per user type |
| Scheduling Module | Availability queries, slot generation, booking creation | PostgreSQL | Owns conflict prevention logic |
| Client Module | Client account CRUD, pet registration | PostgreSQL | Clients can only access their own data |
| Admin Module | Schedule config, block dates, view/cancel appointments | PostgreSQL | All admin routes require admin JWT |
| Notification Module | Enqueue and dispatch WhatsApp + email messages | Redis/BullMQ, WhatsApp API, SMTP | Fire-and-forget from booking handler |
| PostgreSQL | Durable storage for all business data | Express API | Enforces overlap constraint at DB level |
| Redis | BullMQ job queue backing store | Notification worker | Lightweight; can co-locate on same VPS |

---

## Dual Auth Architecture

### Decision: Single users table with role column, NOT separate tables

**Rationale:** The system has exactly two roles (admin, client) with non-overlapping credentials and vastly different profiles. A single table with a `role` enum column is simpler to maintain, avoids JOIN complexity, and still allows role-based middleware. Admin rows are manually inserted (no public registration); client rows are created through the registration flow.

**Alternative considered and rejected:** Completely separate `admins` and `clients` tables. Would require two separate auth paths, duplicate middleware, and complicate any future queries that need to span both types.

### JWT Strategy

```
POST /auth/client/login  → JWT { userId, role: 'client' }
POST /auth/admin/login   → JWT { userId, role: 'admin' }
```

Single `authenticate` middleware validates the token. Route-level `requireRole('admin')` middleware gates admin endpoints. HTTP-only cookies preferred over localStorage for token storage.

**Access token:** 1 hour expiry.
**Refresh token:** 7 days, stored in HTTP-only cookie, rotated on use.

---

## Scheduling / Availability Model

### Core Pattern: Weekly Rules + Exception Overrides

This is the dominant pattern in healthcare scheduling. Do not store individual time slots as rows (that approach creates millions of rows and is hard to update). Instead:

1. **Availability rules** — Define the recurring weekly schedule (e.g., "Monday 08:00–12:00, 13:00–18:00")
2. **Blocked dates** — Override rules for specific dates (holidays, vacations, ad-hoc closures)
3. **Appointments** — Actual bookings consume time within available windows

Slot generation is **computed at query time** (not stored), by taking the day's availability windows, subtracting blocked periods, and subtracting already-booked appointments.

### Slot Duration

Driven by the service selected. Each `service` has a `duration_minutes` column. The API generates slots of that duration within the day's available window.

---

## Database Schema

### Core Tables

```sql
-- Users (both admin and clients)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pets (belong to a client user)
CREATE TABLE pets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  species     TEXT NOT NULL,       -- dog, cat, etc.
  breed       TEXT,
  birth_date  DATE,
  weight_kg   NUMERIC(5, 2),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services catalog
CREATE TABLE services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly availability rules (recurring)
-- day_of_week: 0 = Sunday, 1 = Monday, ... 6 = Saturday
CREATE TABLE availability_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_window CHECK (end_time > start_time)
);

-- Blocked date overrides (exceptions to weekly rules)
CREATE TABLE blocked_periods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_block CHECK (ends_at > starts_at)
);

-- Appointments (the booking record)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE appointments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES users(id),
  pet_id         UUID NOT NULL REFERENCES pets(id),
  service_id     UUID NOT NULL REFERENCES services(id),
  starts_at      TIMESTAMPTZ NOT NULL,
  ends_at        TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL DEFAULT 'confirmed'
                   CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Overlap exclusion: two 'confirmed' appointments cannot share time
  CONSTRAINT no_double_booking
    EXCLUDE USING GIST (tstzrange(starts_at, ends_at) WITH &&)
    WHERE (status = 'confirmed')
);

CREATE INDEX idx_appointments_starts_at ON appointments (starts_at);
CREATE INDEX idx_appointments_client_id ON appointments (client_id);
CREATE INDEX idx_pets_owner_id ON pets (owner_id);
```

### Key Schema Decisions

| Decision | Rationale |
|----------|-----------|
| `UUID` primary keys | No enumerable IDs exposed in API; safe for public routes |
| `EXCLUDE USING GIST` on appointments | Database-level double-booking prevention; survives concurrent transactions |
| `WHERE (status = 'confirmed')` on exclusion | Cancelled appointments do not block time; allows rebooking cancelled slots |
| `availability_rules` separate from `blocked_periods` | Clean separation between "when we normally work" and "when we won't" |
| Slot generation at query time | Avoids stale pre-generated slot rows; trivially handles duration changes |
| `ends_at` stored on appointment | Makes overlap queries simple; derived from `starts_at + service.duration_minutes` |

---

## Conflict Prevention: Double-Booking

### Layer 1 — Application Layer Check (UX)

Before inserting, query for conflicts:

```sql
SELECT 1 FROM appointments
WHERE status = 'confirmed'
  AND tstzrange(starts_at, ends_at) && tstzrange($1, $2)
LIMIT 1;
```

If a conflict is found, return 409 Conflict immediately with a user-friendly message and a fresh list of available slots.

### Layer 2 — Database Constraint (Safety Net)

The `EXCLUDE USING GIST` constraint is the authoritative guard. Even if two concurrent requests pass the application check simultaneously, only one INSERT will succeed. The other will receive a PostgreSQL exception, which the API catches and converts to a 409 response.

**Requires:** `CREATE EXTENSION btree_gist` (bundled with PostgreSQL, no extra install).

**Confidence:** HIGH — this is the canonical PostgreSQL pattern for booking systems; documented in official PostgreSQL docs and widely used in production.

---

## Notification Queue Architecture

### Pattern: BullMQ + Redis, fire-and-forget from the booking handler

```
Client request → POST /appointments
                      │
                      ▼
              DB insert (appointment)
                      │
                      ├──→ enqueue job to Redis/BullMQ (non-blocking, ~1ms)
                      │
                      ▼
              HTTP 201 response to client (fast)
                      │
                      ▼  (async, in worker process)
              BullMQ worker picks up job
                      ├──→ WhatsApp API call (e.g., Twilio, Z-API, or Evolution API)
                      └──→ SMTP email (e.g., Nodemailer + SendGrid/Mailgun)
```

### Job Payload

```json
{
  "type": "booking_confirmation",
  "appointmentId": "uuid",
  "clientPhone": "+55...",
  "clientEmail": "...",
  "adminPhone": "+55...",
  "adminEmail": "...",
  "serviceName": "Consulta",
  "petName": "Rex",
  "startsAt": "2026-04-20T10:00:00Z"
}
```

### Retry Strategy

BullMQ handles retries with exponential backoff automatically. Configure:
- `attempts: 3`
- `backoff: { type: 'exponential', delay: 5000 }`

Failed notifications after all retries should be logged (not surface as booking failures). The booking is confirmed regardless of notification delivery.

### WhatsApp Integration Note

For Brazil, the most practical options in 2025 are:
1. **Evolution API** (self-hosted, free) — most used in Brazilian projects, WhatsApp Web-based
2. **Z-API** (managed SaaS, Brazilian) — paid but reliable
3. **Twilio WhatsApp API** — official, more expensive, requires Meta approval

The notification worker is provider-agnostic if built behind an adapter interface. Choose provider during Phase implementation; the queue architecture is identical for all three.

---

## Data Flow

### Client Books an Appointment

```
Angular (mobile) → POST /appointments
  → authenticate middleware (validate JWT, attach req.user)
  → validate body (service, pet, starts_at)
  → check: pet belongs to req.user.id
  → check: service exists and is active
  → check: starts_at falls within availability_rules for that day
  → check: starts_at does not overlap blocked_periods
  → DB: INSERT appointment (DB constraint is final arbiter)
  → enqueue notification job
  → return 201 { appointment }
```

### Admin Queries Available Slots

```
Angular (admin) → GET /availability?date=2026-04-20&serviceId=uuid
  → fetch availability_rules for that day_of_week
  → fetch blocked_periods overlapping that day
  → fetch confirmed appointments for that day
  → generate slots of service.duration_minutes within rule windows
  → subtract blocked periods
  → subtract booked slots
  → return available slot list
```

### Admin Blocks a Date

```
Angular (admin) → POST /blocked-periods
  → requireRole('admin') middleware
  → INSERT blocked_periods (starts_at, ends_at, reason)
  → existing appointments in that range are NOT auto-cancelled
     (admin must cancel them manually — intentional, avoids surprise cancellations)
  → return 201 { blockedPeriod }
```

---

## Build Order (Dependency Chain)

Components must be built in dependency order. A later component cannot be developed without the earlier one working.

```
1. Database schema + migrations
   └─ Everything depends on this

2. Auth module (users table, JWT issue/validate)
   └─ All protected routes depend on this

3. Services catalog CRUD (admin)
   └─ Availability and appointments depend on service.duration_minutes

4. Availability rules CRUD (admin)
   └─ Slot generation depends on rules existing

5. Pets module (client)
   └─ Appointment creation requires a pet_id

6. Scheduling core
   ├─ GET /availability (slot computation logic)
   └─ POST /appointments (booking + conflict prevention)

7. Blocked periods (admin)
   └─ Depends on slot computation to subtract them

8. Notification queue (BullMQ + Redis setup)
   └─ Wired into appointment creation; can be added after core booking works

9. Admin dashboard views
   ├─ Appointment list (day/week view)
   └─ Appointment cancel/reschedule

10. Client views
    ├─ Booking flow (step-by-step: service → date → slot → confirm)
    ├─ My appointments
    └─ My pets
```

**Key insight:** Steps 1–6 are the critical path. Steps 7–10 can be parallelized across frontend and backend once the scheduling core (step 6) is working. Step 8 (notifications) is independently testable and can be developed in parallel with step 9/10.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Pre-generating all time slot rows
**What:** Creating a row for every 15-minute slot for the next N days.
**Why bad:** Millions of rows; updating working hours requires mass row updates; stale data on schedule changes.
**Instead:** Compute slots at query time from rules + appointments.

### Anti-Pattern 2: Application-only conflict prevention
**What:** Only checking for conflicts in Express, without a DB constraint.
**Why bad:** Two concurrent requests can both pass the check and both insert, creating a double booking.
**Instead:** Always have the `EXCLUDE USING GIST` constraint as the database-level safety net.

### Anti-Pattern 3: Sending notifications synchronously in the booking request
**What:** Awaiting the WhatsApp/email API call before returning HTTP response.
**Why bad:** External API latency (1–10s) degrades booking UX; API failures cause booking failures.
**Instead:** Enqueue the notification job, return 201 immediately.

### Anti-Pattern 4: Admin auto-cancelling appointments when blocking a date
**What:** Automatically cancel all appointments within a newly blocked period.
**Why bad:** Surprise cancellations without admin review; client trust damage.
**Instead:** Admin sees the conflict and cancels appointments manually with a message to each client.

### Anti-Pattern 5: Storing JWT in localStorage
**What:** Angular app stores the access token in localStorage.
**Why bad:** XSS vulnerability can exfiltrate the token.
**Instead:** HTTP-only cookies for refresh token; short-lived access token in memory (Angular service).

---

## Scalability Notes (for reference, not active concern)

This system is designed for a single veterinary clinic with one vet. Scale is not a constraint. The architecture supports the current load without modification.

| Concern | Current approach | If scale ever needed |
|---------|-----------------|---------------------|
| Concurrent bookings | DB EXCLUDE constraint handles races | Already correct |
| Notification throughput | Single BullMQ worker sufficient | Add more workers |
| DB connections | Single PostgreSQL instance | Connection pool (pg-pool) |
| Static files | Nginx serves directly | CDN in front |

---

## Sources

- Vertabelo/Redgate: [A Database Model to Manage Appointments](https://www.red-gate.com/blog/a-database-model-to-manage-appointments-and-organize-schedules/) — schedule, appointment, service tables pattern (HIGH confidence)
- Redgate: [Medical Appointment Booking Data Model](https://www.red-gate.com/blog/the-doctor-will-see-you-soon-a-data-model-for-a-medical-appointment-booking-app) — office_doctor_availability pattern, day_of_week column (HIGH confidence)
- PostgreSQL Docs: [Range Types](https://www.postgresql.org/docs/current/rangetypes.html) — tstzrange and EXCLUDE USING GIST (HIGH confidence)
- Axel Larsson: [Prevent overlapping intervals in Postgres](https://axellarsson.com/blog/postgres-prevent-overlapping-time-inteval/) — EXCLUDE constraint with WHERE clause (MEDIUM confidence, verified against PG docs)
- BullMQ: [Official site](https://bullmq.io/) — async job queue for notifications (HIGH confidence)
- Medium/BullMQ: [Scheduling WhatsApp with BullMQ](https://dev.to/anupom69/scheduling-whatsapp-messages-with-bun-bullmq-3il2) — WhatsApp notification queue pattern (MEDIUM confidence)
- Corbado: [Node.js Express PostgreSQL JWT Authentication with Roles](https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles) — JWT dual auth pattern (MEDIUM confidence)
