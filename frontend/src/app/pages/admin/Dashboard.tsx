import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Users, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import { useApp } from "@/app/context/AppContext";
import {
  fetchAgendamentosAdmin, atualizarStatusAgendamento, mapAppointment,
} from "@/services/api";
import type { Appointment, AppointmentStatus } from "@/app/context/AppContext";
import { statusToBackend } from "@/services/api";

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  pending:   { label: "Aguardando", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado", color: "bg-teal-50 text-teal-700 border-teal-200" },
  cancelled: { label: "Cancelado",  color: "bg-red-50 text-red-600 border-red-200" },
  completed: { label: "Concluído",  color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export function AdminDashboard() {
  const { adminToken } = useAuth();
  const { services } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!adminToken) return;
    try {
      const data = await fetchAgendamentosAdmin(adminToken, { limite: 200 });
      setAppointments(data.map(mapAppointment));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: AppointmentStatus) => {
    if (!adminToken) return;
    try {
      await atualizarStatusAgendamento(id, statusToBackend[status], adminToken);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch {}
  };

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === today);
  const pending   = appointments.filter((a) => a.status === "pending");
  const completed = appointments.filter((a) => a.status === "completed");

  const chartData = services
    .map((s) => ({
      name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
      total: appointments.filter((a) => a.serviceId === s.id).length,
    }))
    .filter((d) => d.total > 0);

  const fmtDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" });

  const statCards = [
    { label: "Total de Agendamentos", value: appointments.length, icon: CalendarCheck, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Atendimentos Hoje",     value: todayAppts.length,   icon: Clock,         color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Aguardando",            value: pending.length,      icon: Users,         color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Concluídos",            value: completed.length,    icon: CheckCircle,   color: "text-green-600", bg: "bg-green-50" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's schedule */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-teal-600" /> Agenda de Hoje
          </h2>
          {todayAppts.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Nenhum agendamento para hoje.</p>
          ) : (
            <div className="space-y-2">
              {todayAppts.slice(0, 5).map((a) => {
                const cfg = statusConfig[a.status];
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-mono text-gray-500 w-10 shrink-0">{a.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{a.ownerName}</p>
                      <p className="text-xs text-gray-400 truncate">{a.pet.name || "—"} · {a.serviceName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending approvals */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={16} className="text-amber-500" /> Aguardando Aprovação
            {pending.length > 0 && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </h2>
          {pending.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Nenhum agendamento pendente.</p>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{a.ownerName}</p>
                    <p className="text-xs text-gray-400">{a.pet.name || "—"} · {fmtDate(a.date)} {a.time}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStatus(a.id, "confirmed")}
                      className="px-2.5 py-1 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleStatus(a.id, "cancelled")}
                      className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-teal-600" /> Agendamentos por Serviço
        </h2>
        {chartData.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">Sem dados para exibir.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#0d9488" radius={[6, 6, 0, 0]} name="Agendamentos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Agendamentos Recentes</h2>
          <Link to="/admin/agendamentos" className="text-xs text-teal-600 hover:underline font-semibold">
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Responsável / Pet", "Serviço", "Data", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 5).map((a) => {
                const cfg = statusConfig[a.status];
                return (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800 text-xs">{a.ownerName}</p>
                      <p className="text-gray-400 text-xs">{a.pet.name || "—"}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">{a.serviceName}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      {fmtDate(a.date)} {a.time}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
