import { useState, useEffect } from "react";
import { Save, Clock, Phone, Mail, MapPin, Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { fetchConfiguracoes, salvarConfiguracoes } from "@/services/api";

const defaultLocalSettings = {
  clinicName:    "Agendaumento",
  phone:         "(11) 3333-4444",
  email:         "contato@agendaumento.com.br",
  address:       "Rua das Flores, 123 — São Paulo, SP",
  monFri:        { open: "08:00", close: "18:00" },
  sat:           { open: "09:00", close: "16:00" },
  sunOpen:       false,
  slotDuration:  30,
};

const defaultSmtp = {
  smtp_host:     "",
  smtp_port:     "587",
  smtp_user:     "",
  smtp_pass:     "",
  smtp_from:     "",
  smtp_ativo:    "false",
};

export function AdminSettings() {
  const { adminToken } = useAuth();
  const [local, setLocal] = useState(defaultLocalSettings);
  const [smtp, setSmtp] = useState(defaultSmtp);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken) return;
    fetchConfiguracoes(adminToken)
      .then((items) => {
        const map: Record<string, string> = {};
        items.forEach((i) => { if (i.valor !== null) map[i.chave] = i.valor; });
        setSmtp((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(map).filter(([k]) => k.startsWith("smtp_"))) }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  const save = async () => {
    if (!adminToken) return;
    setSaving(true);
    setError(null);
    try {
      await salvarConfiguracoes(smtp, adminToken);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 size={18} className="animate-spin" /> Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Clinic Info (local-only) */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={18} className="text-teal-600" />
          <h2 className="text-gray-900 font-bold">Informações do Estabelecimento</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-semibold">Nome do Estabelecimento</label>
            <input
              value={local.clinicName}
              onChange={(e) => setLocal((s) => ({ ...s, clinicName: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">
                <Phone size={11} className="inline mr-1" />Telefone
              </label>
              <input
                value={local.phone}
                onChange={(e) => setLocal((s) => ({ ...s, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">
                <Mail size={11} className="inline mr-1" />E-mail
              </label>
              <input
                value={local.email}
                onChange={(e) => setLocal((s) => ({ ...s, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-semibold">Endereço</label>
            <input
              value={local.address}
              onChange={(e) => setLocal((s) => ({ ...s, address: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
      </div>

      {/* Business Hours (local-only) */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} className="text-teal-600" />
          <h2 className="text-gray-900 font-bold">Horário de Funcionamento</h2>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2 font-semibold">Segunda – Sexta</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Abertura</label>
                <input type="time" value={local.monFri.open}
                  onChange={(e) => setLocal((s) => ({ ...s, monFri: { ...s.monFri, open: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <span className="text-gray-400 mt-5">–</span>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Fechamento</label>
                <input type="time" value={local.monFri.close}
                  onChange={(e) => setLocal((s) => ({ ...s, monFri: { ...s.monFri, close: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 font-semibold">Sábado</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Abertura</label>
                <input type="time" value={local.sat.open}
                  onChange={(e) => setLocal((s) => ({ ...s, sat: { ...s.sat, open: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <span className="text-gray-400 mt-5">–</span>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Fechamento</label>
                <input type="time" value={local.sat.close}
                  onChange={(e) => setLocal((s) => ({ ...s, sat: { ...s.sat, close: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sun-open" checked={local.sunOpen}
              onChange={(e) => setLocal((s) => ({ ...s, sunOpen: e.target.checked }))}
              className="accent-teal-600 w-4 h-4"
            />
            <label htmlFor="sun-open" className="text-sm text-gray-700 cursor-pointer">Aberto aos domingos</label>
          </div>
        </div>
      </div>

      {/* SMTP / Notifications (saved to API) */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-teal-600" />
          <h2 className="text-gray-900 font-bold">Notificações por E-mail (SMTP)</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smtp-ativo"
              checked={smtp.smtp_ativo === "true"}
              onChange={(e) => setSmtp((s) => ({ ...s, smtp_ativo: e.target.checked ? "true" : "false" }))}
              className="accent-teal-600 w-4 h-4"
            />
            <label htmlFor="smtp-ativo" className="text-sm text-gray-700 cursor-pointer font-medium">
              Ativar envio de e-mails
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Servidor SMTP</label>
              <input value={smtp.smtp_host}
                onChange={(e) => setSmtp((s) => ({ ...s, smtp_host: e.target.value }))}
                placeholder="smtp.gmail.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Porta</label>
              <input value={smtp.smtp_port}
                onChange={(e) => setSmtp((s) => ({ ...s, smtp_port: e.target.value }))}
                placeholder="587"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Usuário</label>
              <input value={smtp.smtp_user}
                onChange={(e) => setSmtp((s) => ({ ...s, smtp_user: e.target.value }))}
                placeholder="usuario@gmail.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Senha</label>
              <input type="password" value={smtp.smtp_pass}
                onChange={(e) => setSmtp((s) => ({ ...s, smtp_pass: e.target.value }))}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1 font-semibold">E-mail remetente (From)</label>
              <input value={smtp.smtp_from}
                onChange={(e) => setSmtp((s) => ({ ...s, smtp_from: e.target.value }))}
                placeholder="noreply@agendaumento.com.br"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-all font-semibold disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={15} />}
          Salvar Configurações
        </button>
        {saved && <span className="text-teal-600 text-sm">✓ Configurações salvas!</span>}
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </div>
  );
}
