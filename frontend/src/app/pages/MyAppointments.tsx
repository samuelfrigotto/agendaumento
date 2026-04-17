import { useState } from "react";
import { Search, PawPrint, ChevronDown, ChevronUp, CalendarX, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { buscarAgendamentosPublico, mapAppointment } from "@/services/api";
import type { Appointment, AppointmentStatus } from "@/app/context/AppContext";

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  pending:   { label: "Aguardando", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado", color: "bg-teal-50 text-teal-700 border-teal-200" },
  cancelled: { label: "Cancelado",  color: "bg-red-50 text-red-600 border-red-200" },
  completed: { label: "Concluído",  color: "bg-gray-100 text-gray-600 border-gray-200" },
};

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function autoFormat(v: string) {
  const d = v.replace(/\D/g, "");
  // If typed looks like CPF path (more likely), try CPF format first while typing
  // After 11 digits ambiguous, but CPF always 11 digits; phone usually 10-11
  // We'll detect by length: 11 digits -> CPF, 10 digits -> phone landline, else phone
  if (d.length <= 11 && !v.startsWith("(")) return formatCPF(v);
  return formatPhone(v);
}

export function MyAppointments() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleBuscar = async () => {
    const digits = input.replace(/\D/g, "");
    if (digits.length < 10) { setError("Digite ao menos 10 dígitos."); return; }
    setError(null);
    setLoading(true);
    try {
      const data = await buscarAgendamentosPublico(input);
      setAppointments(data.map(mapAppointment));
      setSubmitted(true);
    } catch {
      setError("Não foi possível buscar os agendamentos.");
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    return a.ownerName.toLowerCase().includes(q) || (a.pet.name && a.pet.name.toLowerCase().includes(q)) || a.serviceName.toLowerCase().includes(q);
  });

  const now = new Date().toISOString().split("T")[0];
  const upcoming = filtered.filter((a) => a.date >= now && a.status !== "cancelled" && a.status !== "completed");
  const past     = filtered.filter((a) => a.date < now || a.status === "cancelled" || a.status === "completed");

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Agendamentos</h1>
      <p className="text-gray-500 mb-6">Consulte seus agendamentos pelo seu CPF ou telefone</p>

      {/* Search form */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-8">
        <label className="block text-xs text-gray-600 font-semibold mb-1">CPF ou Telefone</label>
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(autoFormat(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            placeholder="Ex: 111.690.789-58 ou (46) 98404-4141"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={handleBuscar}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Buscar
          </button>
        </div>
        {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
      </div>

      {!submitted ? null : (
        <>
          {/* Filter */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Filtrar por serviço ou pet..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Upcoming */}
          <div className="mb-8">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              Próximos Agendamentos
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{upcoming.length}</span>
            </h2>
            {upcoming.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <CalendarX size={36} className="mx-auto mb-3 opacity-30" />
                <p className="mb-4">Nenhum agendamento futuro.</p>
                <Link to="/agendar" className="inline-block px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
                  Agendar Agora
                </Link>
              </div>
            ) : (
              <div className="space-y-3">{upcoming.map((a) => <AppointmentCard key={a.id} appt={a} expandedId={expandedId} setExpandedId={setExpandedId} fmtDate={fmtDate} />)}</div>
            )}
          </div>

          {past.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                Histórico
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{past.length}</span>
              </h2>
              <div className="space-y-3 opacity-75">{past.map((a) => <AppointmentCard key={a.id} appt={a} expandedId={expandedId} setExpandedId={setExpandedId} fmtDate={fmtDate} />)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AppointmentCard({ appt, expandedId, setExpandedId, fmtDate }: {
  appt: Appointment;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  fmtDate: (d: string) => string;
}) {
  const isExpanded = expandedId === appt.id;
  const cfg = statusConfig[appt.status];
  const preco = appt.valorCobrado ?? appt.servicePrice;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
        onClick={() => setExpandedId(isExpanded ? null : appt.id)}>
        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
          <PawPrint size={18} className="text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{appt.serviceName}</p>
          <p className="text-gray-400 text-xs">{appt.pet.name ? `${appt.pet.name} · ` : ""}{fmtDate(appt.date)} às {appt.time}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-teal-700 font-semibold text-sm">R$ {preco.toFixed(2).replace(".", ",")}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {appt.pet.name && <div><p className="text-gray-400 font-semibold mb-1">Pet</p><p className="font-semibold text-gray-800">{appt.pet.name}</p></div>}
          {appt.ownerPhone && <div><p className="text-gray-400 font-semibold mb-1">Contato</p><p className="text-gray-600">{appt.ownerPhone}</p></div>}
          {appt.notes && <div><p className="text-gray-400 font-semibold mb-1">Observações</p><p className="text-gray-500 italic">{appt.notes}</p></div>}
          <div>
            <p className="text-gray-400 font-semibold mb-1">Valor</p>
            <p className="text-gray-800 font-semibold">R$ {preco.toFixed(2).replace(".", ",")}</p>
            {appt.valorCobrado !== null && appt.valorCobrado !== appt.servicePrice && (
              <p className="text-gray-400 text-[10px]">padrão: R$ {appt.servicePrice.toFixed(2).replace(".", ",")}</p>
            )}
          </div>
          <div><p className="text-gray-400 font-semibold mb-1">Código</p><p className="text-gray-600 font-mono">#{appt.id}</p></div>
        </div>
      )}
    </div>
  );
}
