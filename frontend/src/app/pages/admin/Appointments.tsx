import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, Search, Filter,
  ChevronDown, ChevronUp, PawPrint, Phone, Loader2
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import {
  fetchAgendamentosAdmin, atualizarStatusAgendamento, mapAppointment, statusToBackend,
} from "@/services/api";
import type { Appointment, AppointmentStatus } from "@/app/context/AppContext";

const statusColors: Record<AppointmentStatus, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-teal-50 text-teal-700 border-teal-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusLabels: Record<AppointmentStatus, string> = {
  pending:   "Aguardando",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

type SortKey = "date" | "ownerName" | "status" | "serviceName";

export function AdminAppointments() {
  const { adminToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [concludingAppt, setConcludingAppt] = useState<Appointment | null>(null);
  const [valorModal, setValorModal] = useState("");

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

  const handleStatus = async (id: string, status: AppointmentStatus, valorCobrado?: number) => {
    if (!adminToken) return;
    setUpdatingId(id);
    try {
      await atualizarStatusAgendamento(id, statusToBackend[status], adminToken, valorCobrado);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status, ...(valorCobrado !== undefined ? { valorCobrado } : {}) } : a))
      );
    } catch {} finally { setUpdatingId(null); }
  };

  const openConcluir = (appt: Appointment) => {
    setConcludingAppt(appt);
    setValorModal(appt.servicePrice.toFixed(2));
  };

  const confirmConcluir = async () => {
    if (!concludingAppt) return;
    const val = parseFloat(valorModal.replace(",", "."));
    await handleStatus(concludingAppt.id, "completed", isNaN(val) ? concludingAppt.servicePrice : val);
    setConcludingAppt(null);
  };

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.ownerName.toLowerCase().includes(q) ||
      (a.pet.name && a.pet.name.toLowerCase().includes(q)) ||
      a.serviceName.toLowerCase().includes(q) ||
      a.ownerPhone.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortKey as keyof Appointment] as string;
    let vb = b[sortKey as keyof Appointment] as string;
    if (sortKey === "date") { va = a.date + a.time; vb = b.date + b.time; }
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
    all:       appointments.length,
    pending:   appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const filterTabs: { value: "all" | AppointmentStatus; label: string }[] = [
    { value: "all",       label: "Todos" },
    { value: "pending",   label: "Aguardando" },
    { value: "confirmed", label: "Confirmado" },
    { value: "completed", label: "Concluído" },
    { value: "cancelled", label: "Cancelado" },
  ];

  const fmtDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 size={18} className="animate-spin" /> Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por responsável, pet ou serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={14} className="text-gray-400 shrink-0" />
            {filterTabs.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border transition-all shrink-0 ${
                  statusFilter === value
                    ? "bg-teal-600 text-white border-teal-600 font-semibold"
                    : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
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
                  { label: "Responsável / Pet", key: "ownerName" as SortKey },
                  { label: "Serviço", key: "serviceName" as SortKey },
                  { label: "Data e Hora", key: "date" as SortKey },
                  { label: "Status", key: "status" as SortKey },
                  { label: "Ações", key: null },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    className={`text-left text-xs text-gray-500 px-4 py-3 font-semibold ${key ? "cursor-pointer hover:text-gray-800 select-none" : ""}`}
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
                    Nenhum agendamento encontrado.
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
                      <p className="text-gray-800 text-xs font-semibold">{appt.ownerName}</p>
                      {appt.pet.name && (
                        <div className="flex items-center gap-1 text-gray-500" style={{ fontSize: "0.7rem" }}>
                          <PawPrint size={10} /> {appt.pet.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{appt.serviceName}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 text-xs font-medium">{fmtDate(appt.date)}</p>
                      <p className="text-gray-500" style={{ fontSize: "0.7rem" }}>{appt.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[appt.status]}`}>
                        {statusLabels[appt.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {updatingId === appt.id ? (
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {appt.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatus(appt.id, "confirmed")}
                                className="p-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
                                title="Confirmar"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleStatus(appt.id, "cancelled")}
                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                title="Cancelar"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {appt.status === "confirmed" && (
                            <>
                              <button
                                onClick={() => openConcluir(appt)}
                                className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="Concluir"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleStatus(appt.id, "cancelled")}
                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                title="Cancelar"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {appt.status === "completed" && (
                            <span className="text-xs text-gray-400">Concluído</span>
                          )}
                          {appt.status === "cancelled" && (
                            <span className="text-xs text-gray-400">Cancelado</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>

                  {expandedId === appt.id && (
                    <tr key={`${appt.id}-expanded`} className="bg-teal-50/50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-gray-400 mb-1 font-semibold">Pet</p>
                            <p className="text-gray-700 font-semibold">{appt.pet.name || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1 font-semibold">Contato</p>
                            {appt.ownerPhone && (
                              <div className="flex items-center gap-1 text-gray-600"><Phone size={10} /> {appt.ownerPhone}</div>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1 font-semibold">Observações</p>
                            <p className="text-gray-600 italic">{appt.notes || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1 font-semibold">Código</p>
                            <p className="text-gray-600 font-mono">#{appt.id}</p>
                            <p className="text-gray-400 mt-0.5">
                              {new Date(appt.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>

                        {appt.valorCobrado !== null && appt.valorCobrado !== appt.servicePrice && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg mt-3">
                            Valor cobrado: <strong>R$ {appt.valorCobrado.toFixed(2).replace(".", ",")}</strong>
                            <span className="text-gray-400 ml-1">(padrão: R$ {appt.servicePrice.toFixed(2).replace(".", ",")})</span>
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400 font-semibold">Alterar Status:</span>
                          {(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((s) => (
                            <button
                              key={s}
                              disabled={appt.status === s || updatingId === appt.id}
                              onClick={() => s === "completed" ? openConcluir(appt) : handleStatus(appt.id, s)}
                              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                                appt.status === s ? statusColors[s] : "border-gray-200 text-gray-500 hover:bg-gray-100"
                              }`}
                              style={{ fontWeight: appt.status === s ? 600 : 400 }}
                            >
                              {statusLabels[s]}
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

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Exibindo {sorted.length} de {appointments.length} agendamentos</p>
        </div>
      </div>

      {/* Modal: valor cobrado */}
      {concludingAppt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-1">Concluir Agendamento</h3>
            <p className="text-gray-500 text-sm mb-4">
              Serviço: <strong>{concludingAppt.serviceName}</strong><br />
              Cliente: {concludingAppt.ownerName}
            </p>
            <label className="block text-xs text-gray-600 font-semibold mb-1">Valor cobrado (R$)</label>
            <input
              type="number" min={0} step={0.01}
              value={valorModal}
              onChange={(e) => setValorModal(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 mb-1"
              autoFocus
            />
            <p className="text-xs text-gray-400 mb-4">Valor padrão do serviço: R$ {concludingAppt.servicePrice.toFixed(2).replace(".", ",")}</p>
            <div className="flex gap-3">
              <button onClick={confirmConcluir} disabled={updatingId === concludingAppt.id}
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {updatingId === concludingAppt.id && <Loader2 size={14} className="animate-spin" />}
                Confirmar
              </button>
              <button onClick={() => setConcludingAppt(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
