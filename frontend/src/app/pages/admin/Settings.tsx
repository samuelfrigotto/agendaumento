import { useState, useEffect } from "react";
import { Save, Clock, Phone, Mail, MapPin, Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useApp } from "@/app/context/AppContext";
import {
  fetchConfiguracoes, salvarConfiguracoes,
  fetchDisponibilidadeRegras, salvarDisponibilidadeRegras,
  type DisponibilidadeRegra,
} from "@/services/api";

const defaultLocal = {
  clinicName:   "Agendaumento",
  phone:        "(11) 3333-4444",
  email:        "contato@agendaumento.com.br",
  address:      "Rua das Flores, 123 — São Paulo, SP",
  monFri:       { open: "08:00", close: "18:00" },
  sat:          { open: "09:00", close: "16:00" },
  sunOpen:      false,
  slotDuration: 30,
};

const defaultSmtp = {
  smtp_host:  "",
  smtp_port:  "587",
  smtp_user:  "",
  smtp_pass:  "",
  smtp_from:  "",
  smtp_ativo: "false",
};

export function AdminSettings() {
  const { adminToken } = useAuth();
  const { refetchClinicInfo } = useApp();
  const [local, setLocal]   = useState(defaultLocal);
  const [smtp, setSmtp]     = useState(defaultSmtp);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken) return;
    Promise.all([
      fetchConfiguracoes(adminToken),
      fetchDisponibilidadeRegras(adminToken),
    ])
      .then(([items, regras]) => {
        // Map config items
        const map: Record<string, string> = {};
        items.forEach((i) => { if (i.valor !== null) map[i.chave] = i.valor; });

        // Load SMTP (keep empty string for smtp_pass so user must retype)
        setSmtp((prev) => ({
          ...prev,
          smtp_host:  map.smtp_host  ?? prev.smtp_host,
          smtp_port:  map.smtp_port  ?? prev.smtp_port,
          smtp_user:  map.smtp_user  ?? prev.smtp_user,
          smtp_from:  map.smtp_from  ?? prev.smtp_from,
          smtp_ativo: map.smtp_ativo ?? prev.smtp_ativo,
          // never pre-fill smtp_pass to avoid sending masked value back
        }));

        // Load clinic info
        setLocal((prev) => ({
          ...prev,
          clinicName: map.clinic_nome      ?? prev.clinicName,
          phone:      map.clinic_telefone  ?? prev.phone,
          email:      map.clinic_email     ?? prev.email,
          address:    map.clinic_endereco  ?? prev.address,
        }));

        // Load business hours from disponibilidade rules
        const monFriRule = regras.find((r) => r.dia_semana === 1 && r.ativo);
        const satRule    = regras.find((r) => r.dia_semana === 6 && r.ativo);
        const sunRule    = regras.find((r) => r.dia_semana === 0 && r.ativo);

        setLocal((prev) => ({
          ...prev,
          monFri: monFriRule
            ? { open: monFriRule.hora_inicio.slice(0, 5), close: monFriRule.hora_fim.slice(0, 5) }
            : prev.monFri,
          sat: satRule
            ? { open: satRule.hora_inicio.slice(0, 5), close: satRule.hora_fim.slice(0, 5) }
            : prev.sat,
          sunOpen: !!sunRule,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  const save = async () => {
    if (!adminToken) return;
    setSaving(true);
    setError(null);
    try {
      // Build config payload
      const configPayload: Record<string, string> = {
        clinic_nome:                    local.clinicName,
        clinic_telefone:                local.phone,
        clinic_email:                   local.email,
        clinic_endereco:                local.address,
        clinic_horario_seg_sex_inicio:  local.monFri.open,
        clinic_horario_seg_sex_fim:     local.monFri.close,
        clinic_horario_sab_inicio:      local.sat.open,
        clinic_horario_sab_fim:         local.sat.close,
        clinic_domingo_aberto:          String(local.sunOpen),
        smtp_host:  smtp.smtp_host,
        smtp_port:  smtp.smtp_port,
        smtp_user:  smtp.smtp_user,
        smtp_from:  smtp.smtp_from,
        smtp_ativo: smtp.smtp_ativo,
      };
      // Only save smtp_pass if user typed a new one
      if (smtp.smtp_pass && smtp.smtp_pass !== "••••••••") {
        configPayload.smtp_pass = smtp.smtp_pass;
      }

      await salvarConfiguracoes(configPayload, adminToken);

      // Build disponibilidade regras from hours
      const regras: DisponibilidadeRegra[] = [];
      for (let d = 1; d <= 5; d++) {
        regras.push({ dia_semana: d, hora_inicio: local.monFri.open, hora_fim: local.monFri.close, ativo: true });
      }
      regras.push({ dia_semana: 6, hora_inicio: local.sat.open, hora_fim: local.sat.close, ativo: true });
      if (local.sunOpen) {
        regras.push({ dia_semana: 0, hora_inicio: local.sat.open, hora_fim: local.sat.close, ativo: true });
      }
      await salvarDisponibilidadeRegras(regras, adminToken);

      // Refresh topbar/footer
      await refetchClinicInfo();

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
      {/* Clinic Info */}
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

      {/* Business Hours */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={18} className="text-teal-600" />
          <h2 className="text-gray-900 font-bold">Horário de Funcionamento</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Esses horários definem os slots disponíveis para agendamento online.
        </p>
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
            <label htmlFor="sun-open" className="text-sm text-gray-700 cursor-pointer">
              Aberto aos domingos (mesmo horário do sábado)
            </label>
          </div>
        </div>
      </div>

      {/* SMTP */}
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
                placeholder="Deixe em branco para manter a atual"
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
