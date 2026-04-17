import { Link } from "react-router";
import {
  Calendar, CheckCircle, Clock, XCircle, TrendingUp,
  ArrowRight, PawPrint, Users
} from "lucide-react";
import { useApp, AppointmentStatus } from "../../context/AppContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statusColors: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-teal-100 text-teal-700 border-teal-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusIcon: Record<AppointmentStatus, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle,
  cancelled: XCircle,
  completed: CheckCircle,
};

export function AdminDashboard() {
  const { appointments, services, updateAppointmentStatus } = useApp();

  const today = new Date().toISOString().split("T")[0];

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    today: appointments.filter((a) => a.date === today && a.status !== "cancelled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const todayAppts = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const recentAppts = [...appointments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Chart: appointments per service
  const serviceChart = services
    .filter((s) => s.active)
    .map((s) => ({
      name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
      count: appointments.filter((a) => a.serviceId === s.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Appointments", value: stats.total, icon: Calendar, color: "bg-blue-500", sub: "All time" },
          { label: "Today's Visits", value: stats.today, icon: Clock, color: "bg-teal-500", sub: "Scheduled today" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "bg-amber-500", sub: "Needs action" },
          { label: "Confirmed", value: stats.confirmed, icon: CheckCircle, color: "bg-green-500", sub: "Ready to go" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.8rem" }}>{value}</p>
            <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>{label}</p>
            <p className="text-gray-400" style={{ fontSize: "0.7rem" }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Today's Schedule</h2>
            <Link to="/admin/appointments" className="text-teal-600 text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppts.map((appt) => {
                const StatusIcon = statusIcon[appt.status];
                return (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                      <PawPrint size={14} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm truncate" style={{ fontWeight: 600 }}>
                        {appt.pet.name} — {appt.serviceName}
                      </p>
                      <p className="text-gray-500 text-xs">{appt.ownerName} · {appt.time}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[appt.status]} shrink-0 flex items-center gap-1`}>
                      <StatusIcon size={10} />
                      {appt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900" style={{ fontWeight: 700 }}>
              Pending Approvals
              {stats.pending > 0 && (
                <span className="ml-2 bg-amber-400 text-amber-900 text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 700 }}>
                  {stats.pending}
                </span>
              )}
            </h2>
          </div>
          {appointments.filter((a) => a.status === "pending").length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">All caught up! No pending appointments.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments
                .filter((a) => a.status === "pending")
                .slice(0, 4)
                .map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm truncate" style={{ fontWeight: 600 }}>
                        {appt.pet.name} — {appt.serviceName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(appt.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {appt.time}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, "confirmed")}
                        className="flex items-center gap-1 bg-teal-500 text-white px-2.5 py-1 rounded-lg text-xs hover:bg-teal-600 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <CheckCircle size={11} />
                        Confirm
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, "cancelled")}
                        className="flex items-center gap-1 bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs hover:bg-red-200 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <XCircle size={11} />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              {stats.pending > 4 && (
                <Link
                  to="/admin/appointments"
                  className="block text-center text-teal-600 text-xs hover:underline pt-1"
                >
                  +{stats.pending - 4} more pending
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-teal-600" />
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Appointments by Service</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={serviceChart} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} name="Appointments" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-teal-600" />
            <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Recent Bookings</h2>
          </div>
          <Link to="/admin/appointments" className="text-teal-600 text-xs hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Owner", "Pet", "Service", "Date", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-400 pb-2 pr-4" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAppts.map((appt) => (
                <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <p className="text-gray-800 text-xs" style={{ fontWeight: 600 }}>{appt.ownerName}</p>
                    <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>{appt.ownerEmail}</p>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600 text-xs">{appt.pet.name}</td>
                  <td className="py-2.5 pr-4 text-gray-600 text-xs">{appt.serviceName}</td>
                  <td className="py-2.5 pr-4 text-gray-500 text-xs">
                    {new Date(appt.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}{appt.time}
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[appt.status]}`} style={{ fontWeight: 500 }}>
                      {appt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
