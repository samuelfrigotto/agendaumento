import { useState } from "react";
import {
  CheckCircle, XCircle, Clock, Search, Filter,
  ChevronDown, ChevronUp, Trash2, PawPrint, Phone, Mail
} from "lucide-react";
import { useApp, Appointment, AppointmentStatus } from "../../context/AppContext";

const statusColors: Record<AppointmentStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-teal-50 text-teal-700 border-teal-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};

type SortKey = "date" | "ownerName" | "status" | "serviceName";

export function AdminAppointments() {
  const { appointments, updateAppointmentStatus, deleteAppointment } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.ownerName.toLowerCase().includes(q) ||
      a.pet.name.toLowerCase().includes(q) ||
      a.serviceName.toLowerCase().includes(q) ||
      a.ownerEmail.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortKey as keyof Appointment] as string;
    let vb = b[sortKey as keyof Appointment] as string;
    if (sortKey === "date") {
      va = a.date + a.time;
      vb = b.date + b.time;
    }
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortKey }) =>
    sortKey === field ? (
      sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    ) : (
      <ChevronDown size={12} className="opacity-30" />
    );

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const filterTabs: { value: "all" | AppointmentStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by owner, pet, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-gray-400 shrink-0" />
            {filterTabs.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border transition-all shrink-0 ${
                  statusFilter === value
                    ? "bg-teal-600 text-white border-teal-600"
                    : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                style={{ fontWeight: statusFilter === value ? 600 : 400 }}
              >
                {label}
                <span className={`ml-0.5 rounded-full px-1 ${statusFilter === value ? "bg-teal-500" : "bg-gray-100 text-gray-500"}`}>
                  {statusCounts[value]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { label: "Owner / Pet", key: "ownerName" as SortKey },
                  { label: "Service", key: "serviceName" as SortKey },
                  { label: "Date & Time", key: "date" as SortKey },
                  { label: "Status", key: "status" as SortKey },
                  { label: "Actions", key: null },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    className={`text-left text-xs text-gray-500 px-4 py-3 ${key ? "cursor-pointer hover:text-gray-800 select-none" : ""}`}
                    style={{ fontWeight: 600 }}
                    onClick={() => key && handleSort(key)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {key && <SortIcon field={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    No appointments found.
                  </td>
                </tr>
              )}
              {sorted.map((appt) => (
                <>
                  <tr
                    key={appt.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === appt.id ? null : appt.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-gray-800 text-xs" style={{ fontWeight: 600 }}>{appt.ownerName}</p>
                      <div className="flex items-center gap-1 text-gray-500" style={{ fontSize: "0.7rem" }}>
                        <PawPrint size={10} />
                        {appt.pet.name} ({appt.pet.species})
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{appt.serviceName}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 text-xs" style={{ fontWeight: 500 }}>
                        {new Date(appt.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-gray-500" style={{ fontSize: "0.7rem" }}>{appt.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[appt.status]}`} style={{ fontWeight: 500 }}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {appt.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateAppointmentStatus(appt.id, "confirmed")}
                              className="p-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
                              title="Confirm"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appt.id, "cancelled")}
                              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                              title="Cancel"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {appt.status === "confirmed" && (
                          <>
                            <button
                              onClick={() => updateAppointmentStatus(appt.id, "completed")}
                              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              title="Mark Completed"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appt.id, "cancelled")}
                              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                              title="Cancel"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {deleteConfirmId === appt.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => { deleteAppointment(appt.id); setDeleteConfirmId(null); }}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg"
                              style={{ fontWeight: 600 }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(appt.id)}
                            className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === appt.id && (
                    <tr key={`${appt.id}-expanded`} className="bg-teal-50/50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-gray-400 mb-1" style={{ fontWeight: 600 }}>Pet Info</p>
                            <p className="text-gray-700" style={{ fontWeight: 600 }}>{appt.pet.name}</p>
                            <p className="text-gray-500">{appt.pet.species} · {appt.pet.breed}</p>
                            <p className="text-gray-500">Age: {appt.pet.age}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1" style={{ fontWeight: 600 }}>Contact</p>
                            <div className="flex items-center gap-1 text-gray-600"><Mail size={10} /> {appt.ownerEmail}</div>
                            <div className="flex items-center gap-1 text-gray-600 mt-0.5"><Phone size={10} /> {appt.ownerPhone}</div>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1" style={{ fontWeight: 600 }}>Notes</p>
                            <p className="text-gray-600 italic">{appt.notes || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1" style={{ fontWeight: 600 }}>Booking ID</p>
                            <p className="text-gray-600 font-mono">{appt.id.toUpperCase()}</p>
                            <p className="text-gray-400 mt-0.5">
                              {new Date(appt.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>

                        {/* Status changer */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400" style={{ fontWeight: 600 }}>Set Status:</span>
                          {(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((s) => (
                            <button
                              key={s}
                              disabled={appt.status === s}
                              onClick={() => updateAppointmentStatus(appt.id, s)}
                              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                                appt.status === s
                                  ? statusColors[s] + " opacity-100"
                                  : "border-gray-200 text-gray-500 hover:bg-gray-100"
                              }`}
                              style={{ fontWeight: appt.status === s ? 600 : 400 }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {sorted.length} of {appointments.length} appointments
          </p>
        </div>
      </div>
    </div>
  );
}
