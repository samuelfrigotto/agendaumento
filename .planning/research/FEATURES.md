# Feature Landscape

**Domain:** Veterinary clinic appointment scheduling (single clinic, Brazil market)
**Researched:** 2026-04-14
**Scope:** One veterinarian, one agenda, mobile-first client portal + admin panel

---

## Table Stakes

Features users expect. Missing = product feels incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Client account creation and login | Without login, no pet history, no booking history, no recurrence — the whole system loses continuity | Low | Email/password; no OAuth needed in v1 |
| Pet registration (name, species, breed, age, weight, observations) | The booking only makes sense attached to a specific animal; vet needs to know what they're treating | Low | Multiple pets per account |
| Services catalog display | Client must see what can be booked before picking a slot | Low | Name + duration only; no price (quoted in person per PROJECT.md) |
| Available slot picker (day + time) | Core scheduling interaction — if this is broken or confusing, nothing else matters | Medium | Must respect admin-defined availability and existing bookings |
| Instant booking confirmation (no admin approval step) | Approval workflows create drop-off; 40% of clients book outside business hours so they can't wait | Low–Medium | Confirmation email + WhatsApp sent immediately on submit |
| Double-booking prevention | Without this, two clients book the same slot — a clinic trust-destroying failure | Medium | Handled server-side with DB constraint; not just UI logic |
| Client notification on booking (WhatsApp + email) | WhatsApp is the dominant channel in Brazil; email as fallback/receipt | Medium | WhatsApp Business API or Evolution API; email via SMTP |
| Admin notification on new booking (WhatsApp + email) | Admin must know a new appointment exists without refreshing the system | Low–Medium | Same channel stack as client notification |
| Client booking history (past + upcoming) | Returning clients expect to see their history; reduces support calls ("when was my last appointment?") | Low | List view sorted by date; filter by pet |
| Admin day/week schedule view | Admin's core daily workflow — must be readable at a glance | Medium | Day view for daily ops; week view for planning |
| Admin availability setup (working hours, recurring slots) | Without this, there's nothing for clients to book into | Medium | Per-weekday hour ranges; generates bookable slots |
| Admin date/time blocking | Holidays, vacations, emergencies — admin must be able to remove specific slots without touching availability rules | Low–Medium | Override on top of recurring availability |
| Admin cancel/reschedule existing appointments | Admin must be able to correct or remove bookings; rescheduling requires notifying client | Medium | Triggers client notification on change |
| Admin pet history view | Before or during an appointment, vet needs to review what the animal has been in for | Low | Filter by pet; shows service + date; not a full medical record |
| Admin service catalog management (name, duration) | Service list must be maintainable without a developer | Low | CRUD; duration drives slot blocking |

---

## Differentiators

Features that set this product apart. Not universally expected, but meaningfully valued once present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Client self-cancel/reschedule | Reduces admin phone load; pet owners can self-serve at midnight | Medium | Must validate that the slot being freed is available for others; notification on change; cutoff window (e.g., no cancel <2h before) recommended |
| Appointment reminder 24h before (WhatsApp + email) | Industry data shows 30–50% no-show reduction with automated reminders; single most impactful post-booking feature | Medium | Scheduled job; same notification channels already built |
| Appointment reminder 2h before | Second-touch reminder significantly increases attendance rate for same-day appointments | Low (incremental) | Requires same infrastructure as 24h reminder |
| Pre-visit intake notes on booking | Client can flag "dog is anxious around other animals" or "cat vomited this morning" at booking time | Low | Observations field already on pet; could be surfaced as booking-step prompt |
| Admin custom observations per appointment | Slot-level notes that differ from per-pet standing observations (e.g., "owner arriving 10min late") | Low | Simple text field on the appointment record |
| Booking confirmation with "add to calendar" link | Reduces no-shows for clients who use digital calendars; common in Brazil among smartphone users | Low | Generate `.ics` attachment or Google Calendar link in confirmation email |

---

## Anti-Features

Features to explicitly NOT build in v1 — either out of scope by design or harmful to the core value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Online payment / deposit collection | PROJECT.md explicitly excludes this; price varies by animal size/breed and is quoted in person; adding payment adds PCI complexity, legal requirements, and integration cost disproportionate to v1 value | Surface "pricing discussed at appointment" in the services catalog UI |
| Admin approval workflow before booking is confirmed | Creates a dead zone between "client submitted" and "booking confirmed"; 40% of bookings happen outside business hours; kills the "book in under 2 minutes" core value | Instant confirmation is the feature; trust the availability rules |
| Multi-professional / room selection | Only one vet, one agenda; any UI for this is dead weight and creates confusion | Keep the booking form single-path; professional is implicit |
| Medical record / prontuário / SOAP notes | This is clinical software territory — a different product with legal, privacy, and workflow requirements; mixing it in creates scope creep and dilutes scheduling UX | Admin's "pet history" shows appointment dates and services only |
| Patient waitlist management | Adds complexity (notifications, ordering, expiry) that isn't warranted at single-vet scale | Admin can manually call or message clients if a slot opens |
| Loyalty programs / points / rewards | Not a scheduling concern; adds significant product complexity for unclear single-clinic ROI | Out of scope indefinitely |
| In-app messaging / chat between client and clinic | WhatsApp already handles this in Brazil; building a parallel channel duplicates effort and splits attention | Confirmation and reminders via WhatsApp; direct queries go to WhatsApp naturally |
| Multi-clinic / SaaS mode | Explicitly out of scope per PROJECT.md | Hardcoded single-tenant architecture; don't abstract for SaaS now |
| Native iOS/Android app | Web mobile-first already delivers the UX; app store deployment adds distribution and update friction for a clinic this size | PWA manifest can be added post-v1 as a cheap enhancement |
| Social login (Google, Facebook) | Adds OAuth complexity; Brazilian clinic clientele comfortable with email registration; reduces control over account data | Email + password; password reset via email link |
| Review / rating system | Out of scope for v1; raises moderation questions | Out of scope |

---

## Feature Dependencies

```
Client login
  └── Pet registration (requires account to attach pets to)
       └── Booking flow (requires at least one pet to select)
            └── Instant confirmation notification (requires booking to exist)
                 └── Reminder notifications (require booking + scheduled job infra)

Admin availability setup
  └── Available slot generation (slot picker reads from availability rules)
       └── Booking flow (requires slots to exist)

Admin service catalog
  └── Services display (client sees what to book)
       └── Slot duration calculation (service duration determines how many slots a booking occupies)

Booking exists
  └── Admin schedule view (reads existing bookings)
  └── Client booking history (reads own bookings)
  └── Admin pet history view (reads bookings by pet)
  └── Admin cancel/reschedule (operates on existing bookings)
  └── Client self-cancel/reschedule (operates on own bookings)

Notification infrastructure (WhatsApp + email)
  └── Booking confirmation (fired on create)
  └── Admin new-booking alert (fired on create)
  └── Cancellation/reschedule notification (fired on update)
  └── Reminder notifications (fired by scheduled job)
```

---

## MVP Recommendation

Build in this order, stopping when the system is usable end-to-end before adding differentiators.

**Phase 1 — Core booking loop (table stakes only):**
1. Client account creation + login
2. Admin login (separate credentials)
3. Admin service catalog management
4. Admin availability setup + date blocking
5. Pet registration (multi-pet per account)
6. Client slot picker and booking submission
7. Double-booking prevention (server-side)
8. Instant confirmation notification (WhatsApp + email — client and admin)
9. Admin day/week schedule view
10. Client booking history (upcoming + past)
11. Admin pet history view
12. Admin cancel / reschedule (with client notification)

**Phase 2 — No-show reduction (highest ROI differentiators):**
13. 24h reminder notification
14. 2h reminder notification
15. Client self-cancel/reschedule with cutoff window

**Phase 3 — Polish (low-complexity differentiators):**
16. "Add to calendar" link in confirmation email
17. Pre-visit intake prompt at booking step (surfaces pet observations field)
18. Admin per-appointment custom observations

**Defer indefinitely:**
- Payment, waitlist, medical records, multi-clinic, native app

---

## Sources

- [SimplesVet — Agenda features (Brazilian market leader)](https://simples.vet/funcionalidades/agenda/)
- [NectarVet — Must-have vs nice-to-have vet scheduling features 2025](https://www.nectarvet.com/post/best-vet-appointment-scheduling-software)
- [Digitail — 6 ways to cut no-shows in vet clinics](https://digitail.com/blog/6-proven-ways-to-cut-missed-appointments-in-your-vet-clinic/)
- [OneWebCare — Mobile experience for veterinary websites 2025](https://onewebcare.com/blog/mobile-experience-for-veterinary-websites/)
- [AmeriVet — Veterinary appointment scheduling challenges](https://amerivet.com/blog/veterinary-appointment-scheduling)
- [ZettaPET — Brazilian veterinary system features](https://zettapet.com.br/)
- [Peti9 — Brazilian clinic/petshop system](https://peti9.com/)
