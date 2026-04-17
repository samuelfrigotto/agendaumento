import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  CheckCircle, PawPrint, Scissors, Calendar, User, ChevronRight,
  Plus, Loader2, LogIn
} from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/app/context/AuthContext";
import {
  fetchSlots, fetchPets, criarPet, fetchTiposAnimais,
  criarAgendamentoCliente, ApiError,
  type BackendPet, type TipoAnimal,
} from "@/services/api";

type Step = 1 | 2 | 3 | 4;
type AuthTab = "login" | "register";

interface FormData {
  serviceId: string;
  date: string;
  time: string;
  notes: string;
}

const emptyForm: FormData = { serviceId: "", date: "", time: "", notes: "" };

export function BookAppointment() {
  const { services, loadingServices } = useApp();
  const { clientToken, clientUser, loginClient, registerClient } = useAuth();
  const activeServices = services.filter((s) => s.active);

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(emptyForm);

  // Date/Time step
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Auth step
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Pet step
  const [pets, setPets] = useState<BackendPet[]>([]);
  const [tiposAnimais, setTiposAnimais] = useState<TipoAnimal[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [petNome, setPetNome] = useState("");
  const [petTipoId, setPetTipoId] = useState<number>(0);
  const [petRaca, setPetRaca] = useState("");
  const [petIdade, setPetIdade] = useState("");
  const [loadingPets, setLoadingPets] = useState(false);
  const [savingPet, setSavingPet] = useState(false);

  // Confirm
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const set = (key: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const today = new Date().toISOString().split("T")[0];
  const selectedService = activeServices.find((s) => s.id === form.serviceId);
  const selectedPet = pets.find((p) => p.id === selectedPetId);

  // Load slots when date or service changes
  useEffect(() => {
    if (!form.date || !selectedService) return;
    setSlots([]);
    set("time", "");
    setLoadingSlots(true);
    fetchSlots(form.date, selectedService.duration)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [form.date, form.serviceId]);

  // Load pets when on step 3 and authenticated
  useEffect(() => {
    if (step !== 3 || !clientToken) return;
    setLoadingPets(true);
    Promise.all([fetchPets(clientToken), fetchTiposAnimais()])
      .then(([p, t]) => {
        setPets(p);
        setTiposAnimais(t);
        if (t.length > 0) setPetTipoId(t[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingPets(false));
  }, [step, clientToken]);

  const handleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await loginClient(cpf, senha);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Credenciais inválidas.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await registerClient(nome, cpf, telefone, senha, email || undefined);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddPet = async () => {
    if (!clientToken || !petNome.trim() || !petTipoId) return;
    setSavingPet(true);
    try {
      const created = await criarPet(
        {
          tipo_animal_id: petTipoId,
          nome: petNome,
          ...(petRaca ? { raca: petRaca } : {}),
          ...(petIdade ? { idade: parseInt(petIdade) } : {}),
        },
        clientToken
      );
      setPets((prev) => [...prev, created]);
      setSelectedPetId(created.id);
      setShowAddPet(false);
      setPetNome(""); setPetRaca(""); setPetIdade("");
    } catch {
      // ignore
    } finally {
      setSavingPet(false);
    }
  };

  const handleConfirm = async () => {
    if (!clientToken || !selectedPetId || !selectedService) return;
    setConfirmError(null);
    setConfirming(true);
    try {
      // Build dataHora in São Paulo timezone offset
      const dataHora = `${form.date}T${form.time}:00-03:00`;
      const result = await criarAgendamentoCliente(
        {
          petId: selectedPetId,
          servicoId: parseInt(form.serviceId),
          dataHora,
          ...(form.notes ? { observacoes: form.notes } : {}),
        },
        clientToken
      );
      setConfirmedId(String(result.id));
    } catch (err: unknown) {
      setConfirmError(
        err instanceof ApiError ? err.message : "Erro ao confirmar agendamento."
      );
    } finally {
      setConfirming(false);
    }
  };

  const fmtDate = (d: string) =>
    d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "";

  const canProceed = () => {
    if (step === 1) return !!form.serviceId;
    if (step === 2) return !!form.date && !!form.time;
    if (step === 3) return !!clientToken && !!selectedPetId;
    return true;
  };

  const steps = [
    { num: 1, label: "Serviço", icon: Scissors },
    { num: 2, label: "Data e Hora", icon: Calendar },
    { num: 3, label: "Conta / Pet", icon: User },
    { num: 4, label: "Confirmar", icon: CheckCircle },
  ];

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (confirmedId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento Realizado!</h2>
        <p className="text-gray-500 mb-2">
          Seu agendamento foi recebido e está{" "}
          <span className="text-amber-600 font-semibold">aguardando confirmação</span>.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Código do agendamento: <strong className="font-mono">#{confirmedId}</strong>
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left text-sm mb-8">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-gray-400">Serviço:</span><p className="font-semibold text-gray-800">{selectedService?.name}</p></div>
            <div><span className="text-gray-400">Data:</span><p className="font-semibold text-gray-800">{fmtDate(form.date)}</p></div>
            <div><span className="text-gray-400">Horário:</span><p className="font-semibold text-gray-800">{form.time}</p></div>
            <div><span className="text-gray-400">Pet:</span><p className="font-semibold text-gray-800">{selectedPet?.nome}</p></div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            to="/meus-agendamentos"
            className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
          >
            Meus Agendamentos
          </Link>
          <button
            onClick={() => { setForm(emptyForm); setStep(1); setConfirmedId(null); setSelectedPetId(null); }}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Agendar Serviço</h1>
      <p className="text-gray-500 text-center mb-8">Escolha o serviço e o melhor horário para o seu pet</p>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {steps.map(({ num, label, icon: Icon }, idx) => (
          <div key={num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                step > num ? "bg-teal-600 text-white" :
                step === num ? "bg-teal-600 text-white ring-4 ring-teal-100" :
                "bg-gray-100 text-gray-400"
              }`}>
                {step > num ? <CheckCircle size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-xs mt-1 ${step >= num ? "text-teal-700 font-semibold" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${step > num ? "bg-teal-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Service */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900 mb-4">Escolha o Serviço</h2>
          {loadingServices ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 size={18} className="animate-spin" /> Carregando serviços…
            </div>
          ) : (
            activeServices.map((s) => (
              <button
                key={s.id}
                onClick={() => set("serviceId", s.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  form.serviceId === s.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-teal-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      form.serviceId === s.id ? "bg-teal-600" : "bg-gray-100"
                    }`}>
                      <Scissors size={18} className={form.serviceId === s.id ? "text-white" : "text-gray-500"} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                      <p className="text-gray-400 text-xs">{s.duration} min</p>
                    </div>
                  </div>
                  <span className="text-teal-700 font-bold">R$ {s.price.toFixed(2).replace(".", ",")}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-gray-900 mb-4">Escolha a Data</h2>
            <input
              type="date"
              min={today}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          {form.date && (
            <div>
              <h2 className="font-bold text-gray-900 mb-4">Escolha o Horário</h2>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                  <Loader2 size={18} className="animate-spin" /> Verificando disponibilidade…
                </div>
              ) : slots.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhum horário disponível para esta data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((time) => (
                    <button
                      key={time}
                      onClick={() => set("time", time)}
                      className={`py-2.5 rounded-xl text-sm border transition-all ${
                        form.time === time
                          ? "bg-teal-600 text-white border-teal-600 font-semibold"
                          : "border-gray-200 text-gray-700 hover:border-teal-400"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Auth + Pet */}
      {step === 3 && (
        <div>
          {!clientToken ? (
            /* Auth section */
            <div>
              <h2 className="font-bold text-gray-900 mb-1">Identificação</h2>
              <p className="text-gray-500 text-sm mb-5">Faça login ou crie uma conta para continuar</p>
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-5">
                {(["login", "register"] as AuthTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setAuthTab(tab); setAuthError(null); }}
                    className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                      authTab === tab
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab === "login" ? "Entrar" : "Criar Conta"}
                  </button>
                ))}
              </div>

              {authTab === "login" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">CPF</label>
                    <input
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Senha</label>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  {authError && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{authError}</p>}
                  <button
                    onClick={handleLogin}
                    disabled={authLoading || !cpf || !senha}
                    className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {authLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                    Entrar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Nome Completo *</label>
                    <input value={nome} onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold mb-1">CPF *</label>
                      <input value={cpf} onChange={(e) => setCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold mb-1">Telefone *</label>
                      <input value={telefone} onChange={(e) => setTelefone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">E-mail (opcional)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Senha *</label>
                    <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  {authError && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{authError}</p>}
                  <button
                    onClick={handleRegister}
                    disabled={authLoading || !nome || !cpf || !telefone || !senha}
                    className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {authLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Criar Conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Pet selection */
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-900">Selecione o Pet</h2>
                <span className="text-xs text-teal-600">Olá, {clientUser?.nome?.split(" ")[0]}!</span>
              </div>
              <p className="text-gray-500 text-sm mb-5">Qual pet será atendido?</p>

              {loadingPets ? (
                <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                  <Loader2 size={18} className="animate-spin" /> Carregando pets…
                </div>
              ) : (
                <div className="space-y-2">
                  {pets.map((pet) => {
                    const tipo = tiposAnimais.find((t) => t.id === pet.tipo_animal_id);
                    return (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPetId(pet.id)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                          selectedPetId === pet.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 bg-white hover:border-teal-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedPetId === pet.id ? "bg-teal-600" : "bg-gray-100"
                          }`}>
                            <PawPrint size={18} className={selectedPetId === pet.id ? "text-white" : "text-gray-500"} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{pet.nome}</p>
                            <p className="text-gray-400 text-xs">
                              {tipo?.nome ?? "—"}{pet.raca ? ` · ${pet.raca}` : ""}
                              {pet.idade ? ` · ${pet.idade} anos` : ""}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {!showAddPet ? (
                    <button
                      onClick={() => setShowAddPet(true)}
                      className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Adicionar novo pet
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl border-2 border-teal-300 bg-teal-50/50 space-y-3">
                      <h3 className="font-semibold text-gray-900 text-sm">Novo Pet</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 font-semibold mb-1">Nome *</label>
                          <input value={petNome} onChange={(e) => setPetNome(e.target.value)}
                            placeholder="Ex: Bolinha"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 font-semibold mb-1">Espécie *</label>
                          <select value={petTipoId} onChange={(e) => setPetTipoId(Number(e.target.value))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                          >
                            {tiposAnimais.map((t) => (
                              <option key={t.id} value={t.id}>{t.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 font-semibold mb-1">Raça</label>
                          <input value={petRaca} onChange={(e) => setPetRaca(e.target.value)}
                            placeholder="Ex: Poodle"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 font-semibold mb-1">Idade (anos)</label>
                          <input type="number" value={petIdade} onChange={(e) => setPetIdade(e.target.value)}
                            min={0} placeholder="Ex: 3"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddPet} disabled={savingPet || !petNome.trim()}
                          className="flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-teal-700 transition-colors"
                        >
                          {savingPet ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                          Adicionar
                        </button>
                        <button onClick={() => setShowAddPet(false)}
                          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="block text-xs text-gray-600 font-semibold mb-1">Observações (opcional)</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  placeholder="Informações adicionais sobre o pet..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Confirmar Agendamento</h2>
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4 mb-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                <Scissors size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedService?.name}</p>
                <p className="text-gray-400 text-sm">
                  {selectedService?.duration} min · R$ {selectedService?.price.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Data</p>
                <p className="font-semibold text-gray-800">{fmtDate(form.date)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Horário</p>
                <p className="font-semibold text-gray-800">{form.time}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Responsável</p>
                <p className="font-semibold text-gray-800">{clientUser?.nome}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Telefone</p>
                <p className="font-semibold text-gray-800">{clientUser?.telefone}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center gap-2">
                <PawPrint size={14} className="text-teal-600" />
                <span className="font-semibold text-gray-800 text-sm">{selectedPet?.nome}</span>
                {selectedPet && tiposAnimais.find((t) => t.id === selectedPet.tipo_animal_id) && (
                  <span className="text-gray-400 text-sm">
                    — {tiposAnimais.find((t) => t.id === selectedPet.tipo_animal_id)?.nome}
                    {selectedPet.raca ? ` · ${selectedPet.raca}` : ""}
                  </span>
                )}
              </div>
              {form.notes && <p className="text-gray-500 text-xs mt-1 italic">{form.notes}</p>}
            </div>
          </div>

          {confirmError && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-xl mb-4">{confirmError}</p>
          )}
          <p className="text-xs text-gray-400 text-center mb-4">
            Ao confirmar, você concorda com nossas políticas de agendamento.
          </p>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-3.5 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-colors text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {confirming ? <Loader2 size={18} className="animate-spin" /> : null}
            Confirmar Agendamento
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      {step < 4 && (
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canProceed()}
            className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            Continuar <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
