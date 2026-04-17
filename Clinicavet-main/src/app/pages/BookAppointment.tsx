import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ChevronRight, ChevronLeft, CheckCircle, Calendar,
  Clock, User, PawPrint, ClipboardList, Stethoscope
} from "lucide-react";
import { useApp } from "../context/AppContext";

const STEPS = ["Service", "Date & Time", "Pet & Owner", "Confirm"];

type FormData = {
  serviceId: string;
  date: string;
  time: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAge: string;
  notes: string;
};

const initialForm: FormData = {
  serviceId: "",
  date: "",
  time: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  petName: "",
  petSpecies: "Dog",
  petBreed: "",
  petAge: "",
  notes: "",
};

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { services, getAvailableSlots, addAppointment } = useApp();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...initialForm, serviceId: searchParams.get("service") ?? "" });
  const [submitted, setSubmitted] = useState(false);
  const [apptId, setApptId] = useState("");

  const activeServices = services.filter((s) => s.active);
  const selectedService = services.find((s) => s.id === form.serviceId);
  const availableSlots = form.date ? getAvailableSlots(form.date, form.serviceId) : [];

  useEffect(() => {
    const prefill = searchParams.get("service");
    if (prefill) setForm((f) => ({ ...f, serviceId: prefill }));
  }, []);

  const update = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const canProceed = () => {
    if (step === 0) return !!form.serviceId;
    if (step === 1) return !!form.date && !!form.time;
    if (step === 2)
      return (
        form.ownerName.trim() !== "" &&
        form.ownerEmail.trim() !== "" &&
        form.ownerPhone.trim() !== "" &&
        form.petName.trim() !== "" &&
        form.petBreed.trim() !== "" &&
        form.petAge.trim() !== ""
      );
    return true;
  };

  const handleSubmit = () => {
    const id = addAppointment({
      ownerName: form.ownerName,
      ownerEmail: form.ownerEmail,
      ownerPhone: form.ownerPhone,
      pet: {
        name: form.petName,
        species: form.petSpecies,
        breed: form.petBreed,
        age: form.petAge,
      },
      serviceId: form.serviceId,
      serviceName: selectedService?.name ?? "",
      date: form.date,
      time: form.time,
      notes: form.notes,
    });
    setApptId(id);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-teal-600" />
          </div>
          <h2 className="text-gray-900 mb-2" style={{ fontWeight: 800, fontSize: "1.5rem" }}>
            Appointment Booked!
          </h2>
          <p className="text-gray-500 mb-1 text-sm">
            Thank you, <span style={{ fontWeight: 600 }}>{form.ownerName}</span>! Your appointment has been submitted.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Confirmation ID: <span className="font-mono text-gray-600">{apptId.toUpperCase()}</span>
          </p>

          <div className="bg-teal-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Service</span>
              <span className="text-gray-900" style={{ fontWeight: 600 }}>{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-900" style={{ fontWeight: 600 }}>
                {new Date(form.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="text-gray-900" style={{ fontWeight: 600 }}>{form.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pet</span>
              <span className="text-gray-900" style={{ fontWeight: 600 }}>{form.petName}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            We'll send a confirmation to <span className="text-gray-600">{form.ownerEmail}</span>. You'll receive a call to confirm your appointment within 24 hours.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/my-appointments")}
              className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-colors"
              style={{ fontWeight: 600 }}
            >
              View My Appointments
            </button>
            <button
              onClick={() => { setForm(initialForm); setSubmitted(false); setStep(0); }}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.8rem" }}>Book an Appointment</h1>
          <p className="text-gray-500 text-sm">Complete the steps below to schedule your visit</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                    i < step
                      ? "bg-teal-600 border-teal-600 text-white"
                      : i === step
                      ? "border-teal-600 text-teal-700 bg-white"
                      : "border-gray-200 text-gray-400 bg-white"
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${i === step ? "text-teal-700" : "text-gray-400"}`}
                  style={{ fontWeight: i === step ? 600 : 400 }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-4 ${i < step ? "bg-teal-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Step 0: Select Service */}
          {step === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Stethoscope size={20} className="text-teal-600" />
                <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Select a Service</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => update("serviceId", s.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      form.serviceId === s.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-100 hover:border-teal-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>{s.name}</span>
                      {form.serviceId === s.id && (
                        <CheckCircle size={15} className="text-teal-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={11} />{s.duration} min</span>
                      <span className="text-teal-600" style={{ fontWeight: 600 }}>${s.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Calendar size={20} className="text-teal-600" />
                <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Choose Date & Time</h2>
              </div>

              <div className="mb-5">
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Appointment Date</label>
                <input
                  type="date"
                  min={getMinDate()}
                  value={form.date}
                  onChange={(e) => { update("date", e.target.value); update("time", ""); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <p className="text-xs text-gray-400 mt-1">We're open Mon–Fri 8am–6pm, Sat 9am–4pm.</p>
              </div>

              {form.date && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>Available Time Slots</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map(({ time, available }) => (
                      <button
                        key={time}
                        disabled={!available}
                        onClick={() => update("time", time)}
                        className={`py-2 rounded-lg text-xs border transition-all ${
                          !available
                            ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                            : form.time === time
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50"
                        }`}
                        style={{ fontWeight: form.time === time ? 600 : 400 }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  {availableSlots.every((s) => !s.available) && (
                    <p className="text-amber-600 text-sm mt-3">
                      All slots are booked for this date. Please choose another day.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Pet & Owner Info */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <User size={20} className="text-teal-600" />
                <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Your Information</h2>
              </div>

              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-3" style={{ fontWeight: 600 }}>Owner Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Full Name *</label>
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={(e) => update("ownerName", e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Phone Number *</label>
                      <input
                        type="tel"
                        value={form.ownerPhone}
                        onChange={(e) => update("ownerPhone", e.target.value)}
                        placeholder="(555) 000-0000"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Email Address *</label>
                      <input
                        type="email"
                        value={form.ownerEmail}
                        onChange={(e) => update("ownerEmail", e.target.value)}
                        placeholder="you@email.com"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3" style={{ fontWeight: 600 }}>
                  <PawPrint size={12} className="inline mr-1" />Pet Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Pet's Name *</label>
                    <input
                      type="text"
                      value={form.petName}
                      onChange={(e) => update("petName", e.target.value)}
                      placeholder="Buddy"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Species *</label>
                    <select
                      value={form.petSpecies}
                      onChange={(e) => update("petSpecies", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option>Dog</option>
                      <option>Cat</option>
                      <option>Rabbit</option>
                      <option>Bird</option>
                      <option>Reptile</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Breed *</label>
                    <input
                      type="text"
                      value={form.petBreed}
                      onChange={(e) => update("petBreed", e.target.value)}
                      placeholder="Golden Retriever"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Age *</label>
                    <input
                      type="text"
                      value={form.petAge}
                      onChange={(e) => update("petAge", e.target.value)}
                      placeholder="3 years"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Additional Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="Describe symptoms, concerns, or anything we should know..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <ClipboardList size={20} className="text-teal-600" />
                <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Confirm Your Appointment</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-teal-50 rounded-xl p-4">
                  <p className="text-xs text-teal-600 uppercase tracking-wide mb-2" style={{ fontWeight: 600 }}>Service</p>
                  <p className="text-gray-900" style={{ fontWeight: 700 }}>{selectedService?.name}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={13} />{selectedService?.duration} min</span>
                    <span className="text-teal-700" style={{ fontWeight: 600 }}>${selectedService?.price}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2" style={{ fontWeight: 600 }}>Date & Time</p>
                  <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>
                    {new Date(form.date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long", month: "long", day: "numeric", year: "numeric"
                    })}
                  </p>
                  <p className="text-gray-600 text-sm">{form.time}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2" style={{ fontWeight: 600 }}>Owner</p>
                  <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{form.ownerName}</p>
                  <p className="text-gray-500 text-xs">{form.ownerEmail} · {form.ownerPhone}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2" style={{ fontWeight: 600 }}>Pet</p>
                  <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{form.petName}</p>
                  <p className="text-gray-500 text-xs">{form.petSpecies} · {form.petBreed} · {form.petAge}</p>
                  {form.notes && (
                    <p className="text-gray-600 text-xs mt-2 italic">"{form.notes}"</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                By confirming, you agree to our cancellation policy. Please arrive 10 minutes early. A staff member will confirm your appointment via phone within 24 hours.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-7 pt-5 border-t border-gray-100">
            <button
              onClick={() => step > 0 && setStep(step - 1)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all ${
                step === 0
                  ? "opacity-0 pointer-events-none"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => canProceed() && setStep(step + 1)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all ${
                  canProceed()
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                style={{ fontWeight: 600 }}
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm bg-teal-600 text-white hover:bg-teal-700 transition-all"
                style={{ fontWeight: 600 }}
              >
                <CheckCircle size={16} />
                Confirm Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
