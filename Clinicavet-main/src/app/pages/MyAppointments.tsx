import { useState } from "react";
import { Link } from "react-router";
import {
  Calendar, Clock, PawPrint, ChevronDown, ChevronUp,
  ArrowRight, AlertCircle, CheckCircle, XCircle, Loader
} from "lucide-react";
import { useApp, Appointment, AppointmentStatus } from "../context/AppContext";

const statusConfig: Record<AppointmentStatus, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  pending: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Loader },
  confirmed: { label: "Confirmed", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle },
  completed: { label: "Completed", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: CheckCircle },
};

function AppointmentCard({ appt, onCancel }: { appt: Appointment; onCancel: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { label, color, bg, icon: StatusIcon } = statusConfig[appt.status];
  const dateObj = new Date(appt.date + "T12:00:00");
  const isPast = dateObj < new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <PawPrint size={22} className="text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-gray-900" style={{ fontWeight: 700 }}>{appt.serviceName}</h3>
                <span
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${bg} ${color}`}
                  style={{ fontWeight: 600 }}
                >
                  <StatusIcon size={11} />
                  {label}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-0.5">
                {appt.pet.name} · {appt.pet.species} ({appt.pet.breed})
              </p>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={12} />
                  {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />
                  {appt.time}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5" style={{ fontWeight: 600 }}>Owner</p>
                <p className="text-gray-700">{appt.ownerName}</p>
                <p className="text-gray-500 text-xs">{appt.ownerEmail}</p>
                <p className="text-gray-500 text-xs">{appt.ownerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5" style={{ fontWeight: 600 }}>Pet Details</p>
                <p className="text-gray-700">{appt.pet.name}</p>
                <p className="text-gray-500 text-xs">{appt.pet.species} · {appt.pet.breed}</p>
                <p className="text-gray-500 text-xs">Age: {appt.pet.age}</p>
              </div>
            </div>
            {appt.notes && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5" style={{ fontWeight: 600 }}>Notes</p>
                <p className="text-gray-600 text-sm italic">"{appt.notes}"</p>
              </div>
            )}
            <p className="text-xs text-gray-400">
              Booked: {new Date(appt.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>

            {(appt.status === "pending" || appt.status === "confirmed") && !isPast && (
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-all"
                style={{ fontWeight: 600 }}
              >
                <XCircle size={13} />
                Cancel Appointment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MyAppointments() {
  const { appointments, updateAppointmentStatus } = useApp();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [emailSearch, setEmailSearch] = useState("");

  // Demo: show all appointments for the mock user (in real app, filter by logged-in user)
  const displayedAppts = appointments.filter((a) => {
    const matchStatus = filter === "all" || a.status === filter;
    const matchEmail = emailSearch === "" || a.ownerEmail.toLowerCase().includes(emailSearch.toLowerCase()) || a.ownerName.toLowerCase().includes(emailSearch.toLowerCase());
    return matchStatus && matchEmail;
  });

  const sorted = [...displayedAppts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const upcoming = sorted.filter((a) => new Date(a.date + "T12:00:00") >= new Date() && a.status !== "cancelled");
  const past = sorted.filter((a) => new Date(a.date + "T12:00:00") < new Date() || a.status === "cancelled");

  const filterOptions: { value: "all" | AppointmentStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.8rem" }}>My Appointments</h1>
          <p className="text-gray-500 text-sm">View and manage your scheduled visits</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <div className="flex gap-1 overflow-x-auto">
            {filterOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                  filter === value
                    ? "bg-teal-600 text-white border-teal-600"
                    : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                style={{ fontWeight: filter === value ? 600 : 400 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Demo note */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 text-xs text-blue-700">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>
            This demo shows all appointments. In a live app, you'd see only your own. Use the search to filter by name.
          </p>
        </div>

        {displayedAppts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-teal-400" />
            </div>
            <h3 className="text-gray-700 mb-2" style={{ fontWeight: 700 }}>No appointments found</h3>
            <p className="text-gray-400 text-sm mb-5">
              {filter !== "all" ? "Try changing your filter." : "You haven't booked any appointments yet."}
            </p>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-all"
              style={{ fontWeight: 600 }}
            >
              Book Appointment <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-gray-700 text-sm mb-3" style={{ fontWeight: 700, letterSpacing: "0.02em" }}>
                  UPCOMING ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onCancel={() => updateAppointmentStatus(appt.id, "cancelled")}
                    />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-gray-500 text-sm mb-3" style={{ fontWeight: 700, letterSpacing: "0.02em" }}>
                  PAST & CANCELLED ({past.length})
                </h2>
                <div className="space-y-3 opacity-80">
                  {past.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onCancel={() => updateAppointmentStatus(appt.id, "cancelled")}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-all"
            style={{ fontWeight: 600 }}
          >
            Book New Appointment <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
