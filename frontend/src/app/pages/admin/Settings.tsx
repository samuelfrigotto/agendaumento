import { useState, useEffect } from "react";
import {
  Save, Clock, Phone, Mail, MapPin, Bell, Loader2, MessageCircle, Building2,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useApp } from "@/app/context/AppContext";
import {
  fetchConfiguracoes, salvarConfiguracoes,
  fetchDisponibilidadeRegras, salvarDisponibilidadeRegras,
  type DisponibilidadeRegra,
} from "@/services/api";

type Tab = "geral" | "horarios" | "email" | "whatsapp";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "geral",     label: "Estabelecimento", icon: Building2 },
  { id: "horarios",  label: "Horários",         icon: Clock },
  { id: "email",     label: "E-mail",           icon: Mail },
  { id: "whatsapp",  label: "WhatsApp",         icon: MessageCircle },
];

const defaultLocal = {
  clinicName: "Agendaumento",
  phone:      "(11) 3333-4444",
  email:      "contato@agendaumento.com.br",
  address:    "Rua das Flores, 123 — São Paulo, SP",
  monFri:     { open: "08:00", close: "18:00" },
  sat:        { open: "09:00", close: "16:00" },
  sunOpen:    false,
  monFriAlmocoAtivo: false,
  monFriAlmoco:      { inicio: "12:00", fim: "13:00" },
  satAlmocoAtivo:    false,
  satAlmoco:         { inicio: "12:00", fim: "13:00" },
};

const defaultSmtp = {
  smtp_host:  "",
  smtp_port:  "587",
  smtp_user:  "",
  smtp_pass:  "",
  smtp_from:  "",
  smtp_ativo: "false",
};

const defaultWhatsapp = {
  whatsapp_ativo:    "false",
  whatsapp_numero:   "",
  whatsapp_api_url:  "",
  whatsapp_token:    "",
};

function TimeRow({
  label,
  open, onOpen,
  close, onClose,
}: {
  label: string;
  open: string; onOpen: (v: string) => void;
  close: string; onClose: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2 font-semibold">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Abertura</label>
          <input type="time" value={open} onChange={(e) => onOpen(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <span className="text-gray-400 mt-5">–</span>
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Fechamento</label>
          <input type="time" value={close} onChange={(e) => onClose(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
      </div>
    </div>
  );
}

function AlmocoToggle({
  ativo, onToggle,
  inicio, onInicio,
  fim, onFim,
}: {
  ativo: boolean; onToggle: (v: boolean) => void;
  inicio: string; onInicio: (v: string) => void;
  fim: string; onFim: (v: string) => void;
}) {
  return (
    <div className="ml-1 pl-4 border-l-2 border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" id={`almoco-${inicio}`} checked={ativo}
          onChange={(e) => onToggle(e.target.checked)}
          className="accent-teal-600 w-4 h-4" />
        <label htmlFor={`almoco-${inicio}`} className="text-xs text-gray-600 cursor-pointer font-medium">
          Intervalo de almoço
        </label>
      </div>
      {ativo && (
        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Início</label>
            <input type="time" value={inicio} onChange={(e) => onInicio(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <span className="text-gray-400 mt-5">–</span>
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Fim</label>
            <input type="time" value={fim} onChange={(e) => onFim(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSettings() {
  const { adminToken } = useAuth();
  const { refetchClinicInfo } = useApp();
  const [tab, setTab] = useState<Tab>("geral");
  const [local, setLocal]     = useState(defaultLocal);
  const [smtp, setSmtp]       = useState(defaultSmtp);
  const [whatsapp, setWpp]    = useState(defaultWhatsapp);
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
        const map: Record<string, string> = {};
        items.forEach((i) => { if (i.valor !== null) map[i.chave] = i.valor; });

        setSmtp((prev) => ({
          ...prev,
          smtp_host:  map.smtp_host  ?? prev.smtp_host,
          smtp_port:  map.smtp_port  ?? prev.smtp_port,
          smtp_user:  map.smtp_user  ?? prev.smtp_user,
          smtp_from:  map.smtp_from  ?? prev.smtp_from,
          smtp_ativo: map.smtp_ativo ?? prev.smtp_ativo,
        }));

        setWpp((prev) => ({
          whatsapp_ativo:   map.whatsapp_ativo   ?? prev.whatsapp_ativo,
          whatsapp_numero:  map.whatsapp_numero  ?? prev.whatsapp_numero,
          whatsapp_api_url: map.whatsapp_api_url ?? prev.whatsapp_api_url,
          whatsapp_token:   map.whatsapp_token   ?? prev.whatsapp_token,
        }));

        const monFriRule = regras.find((r) => r.dia_semana === 1 && r.ativo);
        const satRule    = regras.find((r) => r.dia_semana === 6 && r.ativo);

        // Detect lunch break (2 rules per day: morning + afternoon)
        const monFriRules = regras.filter((r) => r.dia_semana === 1 && r.ativo);
        const satRules    = regras.filter((r) => r.dia_semana === 6 && r.ativo);
        const monFriHasAlmoco = monFriRules.length === 2;
        const satHasAlmoco    = satRules.length === 2;

        setLocal((prev) => ({
          ...prev,
          clinicName: map.clinic_nome     ?? prev.clinicName,
          phone:      map.clinic_telefone ?? prev.phone,
          email:      map.clinic_email    ?? prev.email,
          address:    map.clinic_endereco ?? prev.address,
          monFri: monFriRule
            ? { open: monFriRule.hora_inicio.slice(0, 5), close: monFriRules[monFriHasAlmoco ? 1 : 0].hora_fim.slice(0, 5) }
            : prev.monFri,
          sat: satRule
            ? { open: satRule.hora_inicio.slice(0, 5), close: satRules[satHasAlmoco ? 1 : 0].hora_fim.slice(0, 5) }
            : prev.sat,
          sunOpen: !!regras.find((r) => r.dia_semana === 0 && r.ativo),
          monFriAlmocoAtivo: monFriHasAlmoco,
          monFriAlmoco: monFriHasAlmoco
            ? { inicio: monFriRules[0].hora_fim.slice(0, 5), fim: monFriRules[1].hora_inicio.slice(0, 5) }
            : prev.monFriAlmoco,
          satAlmocoAtivo: satHasAlmoco,
          satAlmoco: satHasAlmoco
            ? { inicio: satRules[0].hora_fim.slice(0, 5), fim: satRules[1].hora_inicio.slice(0, 5) }
            : prev.satAlmoco,
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
      const configPayload: Record<string, string> = {
        clinic_nome:                   local.clinicName,
        clinic_telefone:               local.phone,
        clinic_email:                  local.email,
        clinic_endereco:               local.address,
        clinic_horario_seg_sex_inicio: local.monFri.open,
        clinic_horario_seg_sex_fim:    local.monFri.close,
        clinic_horario_sab_inicio:     local.sat.open,
        clinic_horario_sab_fim:        local.sat.close,
        clinic_domingo_aberto:         String(local.sunOpen),
        clinic_almoco_seg_sex_ativo:   String(local.monFriAlmocoAtivo),
        clinic_almoco_seg_sex_inicio:  local.monFriAlmoco.inicio,
        clinic_almoco_seg_sex_fim:     local.monFriAlmoco.fim,
        clinic_almoco_sab_ativo:       String(local.satAlmocoAtivo),
        clinic_almoco_sab_inicio:      local.satAlmoco.inicio,
        clinic_almoco_sab_fim:         local.satAlmoco.fim,
        smtp_host:  smtp.smtp_host,
        smtp_port:  smtp.smtp_port,
        smtp_user:  smtp.smtp_user,
        smtp_from:  smtp.smtp_from,
        smtp_ativo: smtp.smtp_ativo,
        whatsapp_ativo:   whatsapp.whatsapp_ativo,
        whatsapp_numero:  whatsapp.whatsapp_numero,
        whatsapp_api_url: whatsapp.whatsapp_api_url,
        whatsapp_token:   whatsapp.whatsapp_token,
      };
      if (smtp.smtp_pass && smtp.smtp_pass !== "••••••••") {
        configPayload.smtp_pass = smtp.smtp_pass;
      }

      await salvarConfiguracoes(configPayload, adminToken);

      // Build disponibilidade rules
      const regras: DisponibilidadeRegra[] = [];
      for (let d = 1; d <= 5; d++) {
        if (local.monFriAlmocoAtivo) {
          regras.push({ dia_semana: d, hora_inicio: local.monFri.open,         hora_fim: local.monFriAlmoco.inicio, ativo: true });
          regras.push({ dia_semana: d, hora_inicio: local.monFriAlmoco.fim,    hora_fim: local.monFri.close,        ativo: true });
        } else {
          regras.push({ dia_semana: d, hora_inicio: local.monFri.open, hora_fim: local.monFri.close, ativo: true });
        }
      }
      if (local.satAlmocoAtivo) {
        regras.push({ dia_semana: 6, hora_inicio: local.sat.open,      hora_fim: local.satAlmoco.inicio, ativo: true });
        regras.push({ dia_semana: 6, hora_inicio: local.satAlmoco.fim, hora_fim: local.sat.close,        ativo: true });
      } else {
        regras.push({ dia_semana: 6, hora_inicio: local.sat.open, hora_fim: local.sat.close, ativo: true });
      }
      if (local.sunOpen) {
        regras.push({ dia_semana: 0, hora_inicio: local.sat.open, hora_fim: local.sat.close, ativo: true });
      }
      await salvarDisponibilidadeRegras(regras, adminToken);

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
    <div className="max-w-2xl space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              tab === id ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Estabelecimento */}
      {tab === "geral" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={18} className="text-teal-600" />
            <h2 className="text-gray-900 font-bold">Informações do Estabelecimento</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Nome do Estabelecimento</label>
              <input value={local.clinicName}
                onChange={(e) => setLocal((s) => ({ ...s, clinicName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  <Phone size={11} className="inline mr-1" />Telefone
                </label>
                <input value={local.phone}
                  onChange={(e) => setLocal((s) => ({ ...s, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  <Mail size={11} className="inline mr-1" />E-mail
                </label>
                <input value={local.email}
                  onChange={(e) => setLocal((s) => ({ ...s, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Endereço</label>
              <input value={local.address}
                onChange={(e) => setLocal((s) => ({ ...s, address: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Horários */}
      {tab === "horarios" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={18} className="text-teal-600" />
            <h2 className="text-gray-900 font-bold">Horário de Funcionamento</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Esses horários definem os slots disponíveis para agendamento online.
          </p>
          <div className="space-y-5">
            <div className="space-y-3">
              <TimeRow
                label="Segunda – Sexta"
                open={local.monFri.open}
                onOpen={(v) => setLocal((s) => ({ ...s, monFri: { ...s.monFri, open: v } }))}
                close={local.monFri.close}
                onClose={(v) => setLocal((s) => ({ ...s, monFri: { ...s.monFri, close: v } }))}
              />
              <AlmocoToggle
                ativo={local.monFriAlmocoAtivo}
                onToggle={(v) => setLocal((s) => ({ ...s, monFriAlmocoAtivo: v }))}
                inicio={local.monFriAlmoco.inicio}
                onInicio={(v) => setLocal((s) => ({ ...s, monFriAlmoco: { ...s.monFriAlmoco, inicio: v } }))}
                fim={local.monFriAlmoco.fim}
                onFim={(v) => setLocal((s) => ({ ...s, monFriAlmoco: { ...s.monFriAlmoco, fim: v } }))}
              />
            </div>
            <div className="space-y-3">
              <TimeRow
                label="Sábado"
                open={local.sat.open}
                onOpen={(v) => setLocal((s) => ({ ...s, sat: { ...s.sat, open: v } }))}
                close={local.sat.close}
                onClose={(v) => setLocal((s) => ({ ...s, sat: { ...s.sat, close: v } }))}
              />
              <AlmocoToggle
                ativo={local.satAlmocoAtivo}
                onToggle={(v) => setLocal((s) => ({ ...s, satAlmocoAtivo: v }))}
                inicio={local.satAlmoco.inicio}
                onInicio={(v) => setLocal((s) => ({ ...s, satAlmoco: { ...s.satAlmoco, inicio: v } }))}
                fim={local.satAlmoco.fim}
                onFim={(v) => setLocal((s) => ({ ...s, satAlmoco: { ...s.satAlmoco, fim: v } }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="sun-open" checked={local.sunOpen}
                onChange={(e) => setLocal((s) => ({ ...s, sunOpen: e.target.checked }))}
                className="accent-teal-600 w-4 h-4" />
              <label htmlFor="sun-open" className="text-sm text-gray-700 cursor-pointer">
                Aberto aos domingos (mesmo horário do sábado)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab: E-mail */}
      {tab === "email" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={18} className="text-teal-600" />
            <h2 className="text-gray-900 font-bold">Notificações por E-mail (SMTP)</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="smtp-ativo" checked={smtp.smtp_ativo === "true"}
                onChange={(e) => setSmtp((s) => ({ ...s, smtp_ativo: e.target.checked ? "true" : "false" }))}
                className="accent-teal-600 w-4 h-4" />
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">Porta</label>
                <input value={smtp.smtp_port}
                  onChange={(e) => setSmtp((s) => ({ ...s, smtp_port: e.target.value }))}
                  placeholder="587"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">Usuário</label>
                <input value={smtp.smtp_user}
                  onChange={(e) => setSmtp((s) => ({ ...s, smtp_user: e.target.value }))}
                  placeholder="usuario@gmail.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">Senha</label>
                <input type="password" value={smtp.smtp_pass}
                  onChange={(e) => setSmtp((s) => ({ ...s, smtp_pass: e.target.value }))}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">E-mail remetente (From)</label>
                <input value={smtp.smtp_from}
                  onChange={(e) => setSmtp((s) => ({ ...s, smtp_from: e.target.value }))}
                  placeholder="noreply@agendaumento.com.br"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: WhatsApp */}
      {tab === "whatsapp" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle size={18} className="text-teal-600" />
            <h2 className="text-gray-900 font-bold">Notificações por WhatsApp</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Configure a integração com uma API de WhatsApp para enviar confirmações e lembretes automáticos.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="wpp-ativo" checked={whatsapp.whatsapp_ativo === "true"}
                onChange={(e) => setWpp((s) => ({ ...s, whatsapp_ativo: e.target.checked ? "true" : "false" }))}
                className="accent-teal-600 w-4 h-4" />
              <label htmlFor="wpp-ativo" className="text-sm text-gray-700 cursor-pointer font-medium">
                Ativar notificações por WhatsApp
              </label>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Número do WhatsApp Business</label>
              <input value={whatsapp.whatsapp_numero}
                onChange={(e) => setWpp((s) => ({ ...s, whatsapp_numero: e.target.value }))}
                placeholder="5511999999999 (com DDI e DDD, sem símbolos)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">URL da API</label>
              <input value={whatsapp.whatsapp_api_url}
                onChange={(e) => setWpp((s) => ({ ...s, whatsapp_api_url: e.target.value }))}
                placeholder="https://api.seuproveedor.com/v1"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Token / API Key</label>
              <input type="password" value={whatsapp.whatsapp_token}
                onChange={(e) => setWpp((s) => ({ ...s, whatsapp_token: e.target.value }))}
                placeholder="••••••••••••••••"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
              <strong>Nota:</strong> A integração com WhatsApp requer um provedor de API compatível (ex: Evolution API, Z-API, WPPConnect). Configure o provedor e insira as credenciais acima para ativar o envio automático.
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-all font-semibold disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={15} />}
          Salvar Configurações
        </button>
        {saved && <span className="text-teal-600 text-sm">✓ Salvo!</span>}
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </div>
  );
}
