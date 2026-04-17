import { useState } from "react";
import {
  Plus, Edit2, Trash2, CheckCircle, XCircle, Save, X,
  Clock, Scissors, Heart, Stethoscope, Loader2
} from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/app/context/AuthContext";
import {
  criarServico, atualizarServico, removerServico, mapService,
} from "@/services/api";
import type { Service } from "@/app/context/AppContext";

const iconOptions = ["scissors", "heart", "stethoscope"] as const;
const iconMap: Record<string, React.ElementType> = {
  scissors: Scissors,
  heart: Heart,
  stethoscope: Stethoscope,
};

type ServiceForm = {
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
  icon: string;
};

const defaultForm: ServiceForm = {
  name: "",
  description: "",
  duration: 30,
  price: 0,
  active: true,
  icon: "scissors",
};

export function AdminServices() {
  const { services, refetchServices } = useApp();
  const { adminToken } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<ServiceForm>(defaultForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const update = (field: keyof ServiceForm, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      active: service.active,
      icon: service.icon || "scissors",
    });
    setShowAddForm(false);
  };

  const saveNew = async () => {
    if (!adminToken || !form.name.trim()) return;
    setSaving(true);
    try {
      await criarServico(
        { nome: form.name, descricao: form.description, preco: form.price, duracao_minutos: form.duration },
        adminToken
      );
      await refetchServices();
      setForm(defaultForm);
      setShowAddForm(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!adminToken || !editingId) return;
    setSaving(true);
    try {
      await atualizarServico(
        editingId,
        { nome: form.name, descricao: form.description, preco: form.price, duracao_minutos: form.duration, ativo: form.active },
        adminToken
      );
      await refetchServices();
      setEditingId(null);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service: Service) => {
    if (!adminToken) return;
    try {
      await atualizarServico(service.id, { ativo: !service.active }, adminToken);
      await refetchServices();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) return;
    setDeletingId(id);
    try {
      await removerServico(id, adminToken);
      await refetchServices();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  // Map backend service back to display (after refetch mapService adds icon/category defaults)
  const displayServices = services.map((s) => ({
    ...s,
    icon: s.icon || "scissors",
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{services.length} serviços cadastrados</p>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); setForm(defaultForm); }}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-700 transition-colors font-semibold"
        >
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-teal-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-bold">Novo Serviço</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <ServiceFormFields form={form} update={update} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={saveNew}
              disabled={!form.name.trim() || saving}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={15} />}
              Salvar Serviço
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayServices.map((service) => {
          const Icon = iconMap[service.icon] ?? Scissors;
          const isEditing = editingId === service.id;

          return (
            <div
              key={service.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden ${!service.active ? "opacity-60" : ""}`}
            >
              {isEditing ? (
                <div className="p-5 border-2 border-teal-400 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-bold">Editar Serviço</h3>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                  <ServiceFormFields form={form} update={update} />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-xl text-xs hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={13} />}
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 rounded-xl text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-gray-900 font-bold">{service.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${service.active ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                          {service.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{service.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} />{service.duration} min</span>
                        <span className="text-xs text-teal-700 font-semibold">
                          R$ {service.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => toggleActive(service)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all font-medium ${
                        service.active
                          ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                          : "border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-100"
                      }`}
                    >
                      {service.active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                      {service.active ? "Desativar" : "Ativar"}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(service)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      {deleteConfirmId === service.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(service.id)}
                            disabled={deletingId === service.id}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg font-semibold disabled:opacity-60"
                          >
                            {deletingId === service.id ? "…" : "Excluir"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(service.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceFormFields({
  form,
  update,
}: {
  form: ServiceForm;
  update: (field: keyof ServiceForm, value: string | number | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="block text-xs text-gray-600 mb-1 font-semibold">Nome do Serviço *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ex: Banho Completo"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-gray-600 mb-1 font-semibold">Descrição</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1 font-semibold">Duração (minutos)</label>
        <input
          type="number"
          value={form.duration}
          onChange={(e) => update("duration", Number(e.target.value))}
          min={5}
          step={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1 font-semibold">Preço (R$)</label>
        <input
          type="number"
          value={form.price}
          onChange={(e) => update("price", Number(e.target.value))}
          min={0}
          step={0.01}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1 font-semibold">Ícone</label>
        <select
          value={form.icon}
          onChange={(e) => update("icon", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {iconOptions.map((ic) => <option key={ic}>{ic}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active-check"
          checked={form.active}
          onChange={(e) => update("active", e.target.checked)}
          className="accent-teal-600 w-4 h-4"
        />
        <label htmlFor="active-check" className="text-sm text-gray-700 cursor-pointer">
          Serviço ativo (visível aos clientes)
        </label>
      </div>
    </div>
  );
}
