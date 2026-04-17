import { useState, useEffect, useCallback } from "react";
import { Search, PawPrint, ChevronDown, ChevronUp, Phone, CalendarX, Loader2, LogIn } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import { fetchMeusAgendamentos, cancelarMeuAgendamento, mapAppointment } from "@/services/api";
import type { Appointment, AppointmentStatus } from "@/app/context/AppContext";

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  pending:   { label: "Aguardando", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado", color: "bg-teal-50 text-teal-700 border-teal-200" },
  cancelled: { label: "Cancelado",  color: "bg-red-50 text-red-600 border-red-200" },
  completed: { label: "Concluído",  color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export function MyAppointments() {
  const { clientToken, clientUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientToken) return;
    setLoading(true);
    try {
      const data = await fetchMeusAgendamentos(clientToken);
      setAppointments(data.map(mapAppointment));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [clientToken]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id: string) => {
    if (!clientToken) return;
    setCancellingId(id);
    try {
      await cancelarMeuAgendamento(id, clientToken);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" as AppointmentStatus } : a))
      );
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  };

  // Not authenticated — show login prompt
  if (!clientToken) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CalendarX size={32} className="text-teal-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Meus Agendamentos</h1>
        <p className="text-gray-500 mb-8">
          Faça login para ver e acompanhar seus agendamentos.
        </p>
        <Link
          to="/agendar"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
        >
          <LogIn size={16} /> Entrar e Agendar
        </Link>
      </div>
    );
  }

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.ownerName.toLowerCase().includes(q) ||
      (a.pet.name && a.pet.name.toLowerCase().includes(q)) ||
      a.serviceName.toLowerCase().includes(q)
    );
  });

  const now = new Date().toISOString().split("T")[0];
  const upcoming = filtered.filter(
    (a) => a.date >= now && a.status !== "cancelled" && a.status !== "completed"
  );
  const past = filtered.filter(
    (a) => a.date < now || a.status === "cancelled" || a.status === "completed"
  );

  const fmtDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  const AppointmentCard = ({ appt }: { appt: Appointment }) => {
    const isExpanded = expandedId === appt.id;
    const cfg = statusConfig[appt.status];
    const canCancel = appt.status === "pending";

    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : appt.id)}
        >
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
            <PawPrint size={18} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{appt.serviceName}</p>
            <p className="text-gray-400 text-xs">
              {appt.pet.name ? `${appt.pet.name} · ` : ""}{fmtDate(appt.date)} às {appt.time}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
              {cfg.label}
            </span>
            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 border-t border-gray-50 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {appt.pet.name && (
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Pet</p>
                  <p className="font-semibold text-gray-800">{appt.pet.name}</p>
                </div>
              )}
              {appt.ownerPhone && (
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Contato</p>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Phone size={10} /> {appt.ownerPhone}
                  </div>
                </div>
              )}
              {appt.notes && (
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Observações</p>
                  <p className="text-gray-500 italic">{appt.notes}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 font-semibold mb-1">Código</p>
                <p className="text-gray-600 font-mono">#{appt.id}</p>
                <p className="text-gray-400 mt-0.5">
                  {new Date(appt.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {canCancel && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleCancel(appt.id)}
                  disabled={cancellingId === appt.id}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {cancellingId === appt.id && <Loader2 size={12} className="animate-spin" />}
                  Cancelar Agendamento
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Meus Agendamentos</h1>
        {clientUser && (
          <span className="text-sm text-gray-500">Olá, {clientUser.nome.split(" ")[0]}!</span>
        )}
      </div>
      <p className="text-gray-500 mb-6">Acompanhe seus agendamentos e histórico</p>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por serviço ou pet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 size={18} className="animate-spin" /> Carregando…
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div className="mb-8">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              Próximos Agendamentos
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            </h2>
            {upcoming.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CalendarX size={40} className="mx-auto mb-3 opacity-30" />
                <p className="mb-4">Nenhum agendamento futuro encontrado.</p>
                <Link
                  to="/agendar"
                  className="inline-block px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                >
                  Agendar Agora
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                Histórico
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {past.length}
                </span>
              </h2>
              <div className="space-y-3 opacity-75">
                {past.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
