// ── Base ─────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  {
    method = "GET",
    body,
    token,
  }: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const err = await res.json();
      msg = err.erro || err.message || err.error || msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Status mapping ────────────────────────────────────────────────────────────

import type { AppointmentStatus } from "@/app/context/AppContext";

export const statusToFrontend: Record<string, AppointmentStatus> = {
  pendente: "pending",
  confirmado: "confirmed",
  concluido: "completed",
  cancelado: "cancelled",
};

export const statusToBackend: Record<AppointmentStatus, string> = {
  pending: "pendente",
  confirmed: "confirmado",
  completed: "concluido",
  cancelled: "cancelado",
};

// ── Backend types ─────────────────────────────────────────────────────────────

export interface BackendService {
  id: number;
  nome: string;
  descricao: string | null;
  preco: string;
  duracao_minutos: number;
  ativo: boolean;
  tipos_animais: { id: number; nome: string }[];
}

export interface BackendAppointment {
  id: number;
  data_hora: string;
  status: "pendente" | "confirmado" | "concluido" | "cancelado";
  observacoes: string | null;
  valor_cobrado: string | null;
  criado_em: string;
  cliente_id: number | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  nome_avulso: string | null;
  telefone_avulso: string | null;
  pet_id: number | null;
  pet_nome: string | null;
  pet_nome_avulso: string | null;
  servico_id: number;
  servico_nome: string;
  servico_preco: string;
  duracao_minutos: number;
}

export interface BackendPet {
  id: number;
  nome: string;
  tipo_animal_id: number;
  raca: string | null;
  idade: number | null;
  observacoes: string | null;
}

export interface TipoAnimal {
  id: number;
  nome: string;
}

export interface ConfigItem {
  chave: string;
  valor: string | null;
  descricao?: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

import type { Service, Appointment } from "@/app/context/AppContext";

export function mapService(raw: BackendService): Service {
  return {
    id: String(raw.id),
    name: raw.nome,
    description: raw.descricao ?? "",
    duration: raw.duracao_minutos,
    price: parseFloat(raw.preco),
    category: "",
    icon: "scissors",
    active: raw.ativo,
  };
}

export function mapAppointment(raw: BackendAppointment): Appointment {
  const dt = new Date(raw.data_hora);
  // Convert to São Paulo timezone
  const dateStr = dt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const [d, m, y] = dateStr.split("/");
  const date = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const time = dt.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return {
    id: String(raw.id),
    ownerName: raw.cliente_nome ?? raw.nome_avulso ?? "Desconhecido",
    ownerEmail: "",
    ownerPhone: raw.cliente_telefone ?? raw.telefone_avulso ?? "",
    pet: {
      name: raw.pet_nome ?? raw.pet_nome_avulso ?? "",
      species: "",
      breed: "",
      age: "",
    },
    serviceId: String(raw.servico_id),
    serviceName: raw.servico_nome,
    date,
    time,
    status: statusToFrontend[raw.status] ?? "pending",
    notes: raw.observacoes ?? "",
    createdAt: raw.criado_em,
  };
}

// ── Admin Auth ────────────────────────────────────────────────────────────────

export async function adminLogin(email: string, senha: string) {
  return apiFetch<{
    admin: { id: number; nome: string; email: string };
    token: string;
  }>("/admin/auth/login", { method: "POST", body: { email, senha } });
}

// ── Client Auth ───────────────────────────────────────────────────────────────

export interface ClienteUser {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
}

export async function clienteRegistrar(
  nome: string,
  cpf: string,
  telefone: string,
  senha: string,
  email?: string
) {
  return apiFetch<{ cliente: ClienteUser; token: string }>("/auth/registrar", {
    method: "POST",
    body: { nome, cpf, telefone, senha, ...(email ? { email } : {}) },
  });
}

export async function clienteLogin(cpf: string, senha: string) {
  return apiFetch<{ cliente: ClienteUser; token: string }>("/auth/login", {
    method: "POST",
    body: { cpf, senha },
  });
}

// ── Services ──────────────────────────────────────────────────────────────────

export async function fetchServicos(token?: string | null): Promise<BackendService[]> {
  return apiFetch<BackendService[]>("/servicos", { token });
}

export async function criarServico(
  body: { nome: string; descricao?: string; preco: number; duracao_minutos: number },
  token: string
): Promise<BackendService> {
  return apiFetch<BackendService>("/servicos", { method: "POST", body, token });
}

export async function atualizarServico(
  id: string,
  body: Partial<{
    nome: string;
    descricao: string;
    preco: number;
    duracao_minutos: number;
    ativo: boolean;
  }>,
  token: string
): Promise<BackendService> {
  return apiFetch<BackendService>(`/servicos/${id}`, { method: "PATCH", body, token });
}

export async function removerServico(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/servicos/${id}`, { method: "DELETE", token });
}

// ── Appointments (admin) ──────────────────────────────────────────────────────

export async function fetchAgendamentosAdmin(
  token: string,
  params?: { status?: string; pagina?: number; limite?: number }
): Promise<BackendAppointment[]> {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  return apiFetch<BackendAppointment[]>(`/agendamentos/admin${qs}`, { token });
}

export async function atualizarStatusAgendamento(
  id: string,
  status: string,
  token: string
): Promise<BackendAppointment> {
  return apiFetch<BackendAppointment>(`/agendamentos/admin/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

// ── Appointments (client) ─────────────────────────────────────────────────────

export async function fetchMeusAgendamentos(token: string): Promise<BackendAppointment[]> {
  return apiFetch<BackendAppointment[]>("/agendamentos/meus", { token });
}

export async function criarAgendamentoCliente(
  body: {
    petId: number;
    servicoId: number;
    dataHora: string;
    observacoes?: string;
  },
  token: string
): Promise<BackendAppointment> {
  return apiFetch<BackendAppointment>("/agendamentos", {
    method: "POST",
    body,
    token,
  });
}

export async function cancelarMeuAgendamento(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/agendamentos/${id}/cancelar`, {
    method: "PATCH",
    token,
  });
}

// ── Pets ──────────────────────────────────────────────────────────────────────

export async function fetchPets(token: string): Promise<BackendPet[]> {
  return apiFetch<BackendPet[]>("/pets", { token });
}

export async function criarPet(
  body: { tipo_animal_id: number; nome: string; raca?: string; idade?: number },
  token: string
): Promise<BackendPet> {
  return apiFetch<BackendPet>("/pets", { method: "POST", body, token });
}

// ── Tipos Animais ─────────────────────────────────────────────────────────────

export async function fetchTiposAnimais(): Promise<TipoAnimal[]> {
  return apiFetch<TipoAnimal[]>("/tipos-animais");
}

// ── Disponibilidade ───────────────────────────────────────────────────────────

export interface DisponibilidadeRegra {
  id?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

export async function fetchSlots(data: string, duracao: number): Promise<string[]> {
  const res = await apiFetch<{ data: string; slots: string[] }>(
    `/disponibilidade/slots?data=${data}&duracao=${duracao}`
  );
  return res.slots ?? [];
}

export async function fetchDisponibilidadeRegras(token: string): Promise<DisponibilidadeRegra[]> {
  return apiFetch<DisponibilidadeRegra[]>("/disponibilidade/regras", { token });
}

export async function salvarDisponibilidadeRegras(
  regras: DisponibilidadeRegra[],
  token: string
): Promise<void> {
  return apiFetch<void>("/disponibilidade/regras", {
    method: "PUT",
    body: { regras },
    token,
  });
}

// ── Configurações ─────────────────────────────────────────────────────────────

export async function fetchConfiguracoesPublico(): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>("/admin/configuracoes/publico");
}

export async function fetchConfiguracoes(token: string): Promise<ConfigItem[]> {
  return apiFetch<ConfigItem[]>("/admin/configuracoes", { token });
}

export async function salvarConfiguracoes(
  configs: Record<string, string>,
  token: string
): Promise<void> {
  return apiFetch<void>("/admin/configuracoes", {
    method: "PUT",
    body: configs,
    token,
  });
}
