import { useState } from "react";
import { Save, Clock, Phone, Mail, MapPin, Bell, Calendar } from "lucide-react";

const defaultSettings = {
  clinicName: "Paws Vet Clinic",
  phone: "(555) 867-5309",
  email: "hello@pawsvetclinic.com",
  address: "123 Maple Street, Springfield, IL 62701",
  monFri: { open: "08:00", close: "18:00" },
  sat: { open: "09:00", close: "16:00" },
  sunOpen: false,
  slotDuration: 30,
  confirmEmail: true,
  confirmSms: false,
  reminderHours: 24,
};

export function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Clinic Info */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={18} className="text-teal-600" />
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Clinic Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Clinic Name</label>
            <input
              value={settings.clinicName}
              onChange={(e) => setSettings((s) => ({ ...s, clinicName: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>
                <Phone size={11} className="inline mr-1" />Phone
              </label>
              <input
                value={settings.phone}
                onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>
                <Mail size={11} className="inline mr-1" />Email
              </label>
              <input
                value={settings.email}
                onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Address</label>
            <input
              value={settings.address}
              onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} className="text-teal-600" />
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Business Hours</h2>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2" style={{ fontWeight: 600 }}>Monday – Friday</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Open</label>
                <input
                  type="time"
                  value={settings.monFri.open}
                  onChange={(e) => setSettings((s) => ({ ...s, monFri: { ...s.monFri, open: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <span className="text-gray-400 mt-5">–</span>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Close</label>
                <input
                  type="time"
                  value={settings.monFri.close}
                  onChange={(e) => setSettings((s) => ({ ...s, monFri: { ...s.monFri, close: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2" style={{ fontWeight: 600 }}>Saturday</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Open</label>
                <input
                  type="time"
                  value={settings.sat.open}
                  onChange={(e) => setSettings((s) => ({ ...s, sat: { ...s.sat, open: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <span className="text-gray-400 mt-5">–</span>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Close</label>
                <input
                  type="time"
                  value={settings.sat.close}
                  onChange={(e) => setSettings((s) => ({ ...s, sat: { ...s.sat, close: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sun-open"
              checked={settings.sunOpen}
              onChange={(e) => setSettings((s) => ({ ...s, sunOpen: e.target.checked }))}
              className="accent-teal-600 w-4 h-4"
            />
            <label htmlFor="sun-open" className="text-sm text-gray-700 cursor-pointer">Open on Sundays</label>
          </div>
        </div>
      </div>

      {/* Scheduling */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={18} className="text-teal-600" />
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Scheduling Settings</h2>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Default Slot Duration (minutes)</label>
          <select
            value={settings.slotDuration}
            onChange={(e) => setSettings((s) => ({ ...s, slotDuration: Number(e.target.value) }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-teal-600" />
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Notifications</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Email confirmations</p>
              <p className="text-xs text-gray-400">Send confirmation emails to clients</p>
            </div>
            <input
              type="checkbox"
              checked={settings.confirmEmail}
              onChange={(e) => setSettings((s) => ({ ...s, confirmEmail: e.target.checked }))}
              className="accent-teal-600 w-4 h-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>SMS reminders</p>
              <p className="text-xs text-gray-400">Send text reminders before appointments</p>
            </div>
            <input
              type="checkbox"
              checked={settings.confirmSms}
              onChange={(e) => setSettings((s) => ({ ...s, confirmSms: e.target.checked }))}
              className="accent-teal-600 w-4 h-4"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>Reminder advance notice (hours)</label>
            <input
              type="number"
              value={settings.reminderHours}
              onChange={(e) => setSettings((s) => ({ ...s, reminderHours: Number(e.target.value) }))}
              min={1}
              max={72}
              className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-all"
          style={{ fontWeight: 600 }}
        >
          <Save size={15} />
          Save Settings
        </button>
        {saved && (
          <span className="text-teal-600 text-sm flex items-center gap-1">
            ✓ Settings saved!
          </span>
        )}
      </div>
    </div>
  );
}
