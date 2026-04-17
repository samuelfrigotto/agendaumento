import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, TrendingUp, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useAuth } from "@/app/context/AuthContext";
import {
  fetchFinanceiroResumo, fetchFinanceiroMensal, fetchFinanceiroPorServico, fetchFinanceiroItens,
  type FinanceiroResumo, type FinanceiroMensal, type FinanceiroPorServico, type FinanceiroItem,
} from "@/services/api";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  concluido:  { label: "Concluído",  color: "bg-gray-100 text-gray-600 border-gray-200" },
  confirmado: { label: "Confirmado", color: "bg-teal-50 text-teal-700 border-teal-200" },
  pendente:   { label: "Aguardando", color: "bg-amber-50 text-amber-700 border-amber-200" },
  cancelado:  { label: "Cancelado",  color: "bg-red-50 text-red-600 border-red-200" },
};

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtMes(ym: string) {
  const [y, m] = ym.split("-");
  return `${MESES[parseInt(m) - 1]}/${y.slice(2)}`;
}

export function AdminFinancial() {
  const { adminToken } = useAuth();

  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  const [resumo, setResumo]         = useState<FinanceiroResumo | null>(null);
  const [mensal, setMensal]         = useState<FinanceiroMensal[]>([]);
  const [porServico, setPorServico] = useState<FinanceiroPorServico[]>([]);
  const [itens, setItens]           = useState<FinanceiroItem[]>([]);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [r, m, ps, it] = await Promise.all([
        fetchFinanceiroResumo(adminToken, mes, ano),
        fetchFinanceiroMensal(adminToken),
        fetchFinanceiroPorServico(adminToken, mes, ano),
        fetchFinanceiroItens(adminToken, mes, ano),
      ]);
      setResumo(r);
      setMensal(m);
      setPorServico(ps);
      setItens(it);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [adminToken, mes, ano]);

  useEffect(() => { load(); }, [load]);

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAno((y) => y - 1); }
    else setMes((m) => m - 1);
  };
  const nextMes = () => {
    if (mes === 12) { setMes(1); setAno((y) => y + 1); }
    else setMes((m) => m + 1);
  };

  const ticketMedio = resumo && resumo.total_concluidos > 0
    ? resumo.receita_total / resumo.total_concluidos
    : 0;

  const statCards = resumo ? [
    {
      label: "Receita do Mês",
      value: fmtBRL(resumo.receita_total),
      icon: DollarSign,
      bg: "bg-teal-50", color: "text-teal-600",
    },
    {
      label: "Concluídos",
      value: resumo.total_concluidos,
      icon: CheckCircle,
      bg: "bg-green-50", color: "text-green-600",
    },
    {
      label: "Cancelados",
      value: resumo.total_cancelados,
      icon: XCircle,
      bg: "bg-red-50", color: "text-red-500",
    },
    {
      label: "Ticket Médio",
      value: fmtBRL(ticketMedio),
      icon: TrendingUp,
      bg: "bg-blue-50", color: "text-blue-600",
    },
  ] : [];

  if (loading && !resumo) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 size={18} className="animate-spin" /> Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button onClick={prevMes} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="font-bold text-gray-800 w-32 text-center text-sm">
          {MESES[mes - 1]} {ano}
        </span>
        <button onClick={nextMes} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronRight size={16} />
        </button>
        {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly trend */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-teal-600" /> Receita — Últimos 6 Meses
          </h2>
          {mensal.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mensal} barSize={28}>
                <XAxis dataKey="mes" tickFormatter={fmtMes} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} width={55} />
                <Tooltip
                  formatter={(v: number) => [fmtBRL(v), "Receita"]}
                  labelFormatter={fmtMes}
                />
                <Bar dataKey="receita" radius={[6, 6, 0, 0]} name="Receita">
                  {mensal.map((entry) => (
                    <Cell
                      key={entry.mes}
                      fill={entry.mes === `${ano}-${String(mes).padStart(2, "0")}` ? "#0d9488" : "#99f6e4"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By service */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-teal-600" /> Por Serviço — {MESES[mes - 1]}
          </h2>
          {porServico.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Sem atendimentos concluídos.</p>
          ) : (
            <div className="space-y-2">
              {porServico.map((s) => {
                const pct = resumo && resumo.receita_total > 0
                  ? Math.round((s.receita / resumo.receita_total) * 100)
                  : 0;
                return (
                  <div key={s.servico_nome}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700 truncate max-w-[55%]">{s.servico_nome}</span>
                      <span className="text-gray-500">{s.total_concluidos}× · {fmtBRL(s.receita)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Agendamentos — {MESES[mes - 1]} {ano}</h2>
        </div>
        {itens.length === 0 ? (
          <p className="text-gray-400 text-sm py-10 text-center">Nenhum agendamento neste mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Data", "Cliente", "Serviço", "Valor", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => {
                  const dt = new Date(item.data_hora);
                  const data = dt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" });
                  const cfg = STATUS_LABEL[item.status] ?? { label: item.status, color: "bg-gray-100 text-gray-600 border-gray-200" };
                  const valor = item.valor_cobrado ? parseFloat(item.valor_cobrado) : null;
                  return (
                    <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">{data}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-gray-800">{item.cliente_nome ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{item.servico_nome}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-teal-700">
                        {valor !== null ? fmtBRL(valor) : "—"}
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
        )}
      </div>
    </div>
  );
}
