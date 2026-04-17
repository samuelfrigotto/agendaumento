import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { PawPrint, Phone, Mail, MapPin, Clock, Menu, X } from "lucide-react";
import { useApp } from "@/app/context/AppContext";

const navLinks = [
  { to: "/", label: "Início" },
  { to: "/servicos", label: "Serviços" },
  { to: "/agendar", label: "Agendar" },
  { to: "/meus-agendamentos", label: "Meus Agendamentos" },
];

function fmtH(t: string) {
  const [h, m] = t.split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { clinicInfo, services } = useApp();

  const horaSegSex = `${fmtH(clinicInfo.horarioSegSexInicio)}–${fmtH(clinicInfo.horarioSegSexFim)}`;
  const horaSab    = `${fmtH(clinicInfo.horarioSabInicio)}–${fmtH(clinicInfo.horarioSabFim)}`;
  const horaTexto  = `Seg–Sex: ${horaSegSex} | Sáb: ${horaSab}`;

  const footerServicos = services.filter((s) => s.active).slice(0, 4).map((s) => s.name);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-teal-800 text-teal-100 text-xs py-2 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone size={11} /> {clinicInfo.telefone}
            </span>
            <span className="flex items-center gap-1">
              <Mail size={11} /> {clinicInfo.email}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <MapPin size={11} /> {clinicInfo.endereco}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={11} />
            <span>{horaTexto}</span>
            <span className="mx-2 text-teal-400">|</span>
            <Link to="/admin" className="text-teal-200 hover:text-white transition-colors font-medium">
              Área Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <PawPrint size={20} className="text-white" />
            </div>
            <div>
              <p className="text-gray-900 leading-none" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                {clinicInfo.nome}
              </p>
              <p className="text-teal-600 leading-none" style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em" }}>
                CUIDANDO DO SEU PET
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                  location.pathname === to
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/agendar"
              className="ml-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Agendar Agora
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="block py-2.5 text-sm text-gray-700 border-b border-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/agendar"
              className="mt-3 block text-center px-4 py-2.5 bg-teal-600 text-white text-sm rounded-xl"
              style={{ fontWeight: 600 }}
              onClick={() => setMenuOpen(false)}
            >
              Agendar Agora
            </Link>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <PawPrint size={16} className="text-white" />
              </div>
              <span className="text-white font-bold">{clinicInfo.nome}</span>
            </div>
            <p className="text-sm leading-relaxed">
              Cuidado especializado em banho e tosa para o seu pet com amor e profissionalismo.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Navegação</h4>
            <ul className="space-y-2 text-sm">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Serviços</h4>
            <ul className="space-y-2 text-sm">
              {footerServicos.length > 0
                ? footerServicos.map((nome) => <li key={nome}>{nome}</li>)
                : ["Banho Completo", "Tosa na Tesoura", "Tosa na Navalha", "Hidratação"].map((s) => (
                    <li key={s}>{s}</li>
                  ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Phone size={13} /> {clinicInfo.telefone}</li>
              <li className="flex items-center gap-2"><Mail size={13} /> {clinicInfo.email}</li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                {clinicInfo.endereco}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} {clinicInfo.nome}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
