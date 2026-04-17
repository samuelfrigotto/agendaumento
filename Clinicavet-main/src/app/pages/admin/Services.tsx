import { useState } from "react";
import {
  Plus, Edit2, Trash2, CheckCircle, XCircle, Save, X,
  Clock, DollarSign, Stethoscope, Syringe, Scissors, Heart
} from "lucide-react";
import { useApp, Service } from "../../context/AppContext";

const iconOptions = ["stethoscope", "syringe", "scissors", "heart", "scan", "flask", "ambulance", "tooth"];
const categoryOptions = ["Preventive Care", "Dental", "Grooming", "Surgery", "Diagnostics", "Emergency"];

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  syringe: Syringe,
  scissors: Scissors,
  heart: Heart,
  scan: () => <span>🔬</span>,
  flask: () => <span>🧪</span>,
  ambulance: () => <span>🚑</span>,
  tooth: () => <span>🦷</span>,
};

type ServiceForm = Omit<Service, "id">;

const defaultForm: ServiceForm = {
  name: "",
  description: "",
  duration: 30,
  price: 0,
  category: "Preventive Care",
  icon: "stethoscope",
  active: true,
};

export function AdminServices() {
  const { services, addService, updateService, deleteService, appointments } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<ServiceForm>(defaultForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const update = (field: keyof ServiceForm, value: string | number | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      icon: service.icon,
      active: service.active,
    });
    setShowAddForm(false);
  };

  const saveEdit = () => {
    if (editingId) {
      updateService(editingId, form);
      setEditingId(null);
    }
  };

  const saveNew = () => {
    if (form.name.trim()) {
      addService(form);
      setForm(defaultForm);
      setShowAddForm(false);
    }
  };

  const getApptCount = (id: string) => appointments.filter((a) => a.serviceId === id).length;

  return (
    <div className="space-y-5">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{services.length} services configured</p>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); setForm(defaultForm); }}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-700 transition-colors"
          style={{ fontWeight: 600 }}
        >
          <Plus size={16} />
          Add Service
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-teal-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900" style={{ fontWeight: 700 }}>New Service</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <ServiceFormFields form={form} update={update} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={saveNew}
              disabled={!form.name.trim()}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Save size={15} />
              Save Service
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = iconMap[service.icon] ?? Stethoscope;
          const isEditing = editingId === service.id;
          const apptCount = getApptCount(service.id);

          return (
            <div
              key={service.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden ${!service.active ? "opacity-60" : ""}`}
            >
              {isEditing ? (
                <div className="p-5 border-2 border-teal-400 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Edit Service</h3>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                  <ServiceFormFields form={form} update={update} />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-xl text-xs hover:bg-teal-700 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      <Save size={13} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 rounded-xl text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
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
                        <h3 className="text-gray-900" style={{ fontWeight: 700 }}>{service.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${service.active ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"}`} style={{ fontWeight: 500 }}>
                          {service.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{service.description}</p>

                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} />{service.duration} min</span>
                        <span className="flex items-center gap-1 text-xs text-teal-700" style={{ fontWeight: 600 }}>
                          <DollarSign size={11} />{service.price}
                        </span>
                        <span className="text-xs text-gray-400">{apptCount} appointment{apptCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateService(service.id, { active: !service.active })}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                          service.active
                            ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                            : "border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-100"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {service.active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        {service.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(service)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      {deleteConfirmId === service.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { deleteService(service.id); setDeleteConfirmId(null); }}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg"
                            style={{ fontWeight: 600 }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(service.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
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
  form: Omit<Service, "id">;
  update: (field: keyof Omit<Service, "id">, value: string | number | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Service Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. General Consultation"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Duration (minutes)</label>
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
        <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Price ($)</label>
        <input
          type="number"
          value={form.price}
          onChange={(e) => update("price", Number(e.target.value))}
          min={0}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Category</label>
        <select
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {categoryOptions.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Icon</label>
        <select
          value={form.icon}
          onChange={(e) => update("icon", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {iconOptions.map((ic) => <option key={ic}>{ic}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <input
          type="checkbox"
          id="active-check"
          checked={form.active}
          onChange={(e) => update("active", e.target.checked)}
          className="accent-teal-600 w-4 h-4"
        />
        <label htmlFor="active-check" className="text-sm text-gray-700 cursor-pointer">
          Service is active (visible to clients)
        </label>
      </div>
    </div>
  );
}
