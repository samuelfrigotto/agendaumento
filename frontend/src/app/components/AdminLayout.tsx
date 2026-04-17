import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  PawPrint, LayoutDashboard, CalendarCheck, Scissors, Settings, ArrowLeft, Menu, X, LogOut, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

const navItems = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: CalendarCheck },
  { to: "/admin/servicos", label: "Serviços", icon: Scissors },
  { to: "/admin/financeiro", label: "Financeiro", icon: TrendingUp },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, logoutAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  const initials = adminUser?.nome
    ? adminUser.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-teal-800 text-white shrink-0">
        <div className="px-5 py-5 border-b border-teal-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <PawPrint size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold leading-none text-sm">Agendaumento</p>
              <p className="text-teal-300 leading-none mt-0.5" style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                PAINEL ADMIN
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive(to, exact)
                  ? "bg-teal-600 text-white font-semibold"
                  : "text-teal-200 hover:bg-teal-700 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-5 border-t border-teal-700 pt-4">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-none truncate">{adminUser?.nome ?? "Administrador"}</p>
              <p className="text-teal-400 leading-none mt-0.5 truncate" style={{ fontSize: "0.65rem" }}>
                {adminUser?.email ?? "Admin"}
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-teal-300 hover:text-white text-xs transition-colors"
          >
            <ArrowLeft size={13} /> Voltar ao Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-teal-300 hover:text-red-400 text-xs transition-colors w-full"
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-teal-800 text-white px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PawPrint size={18} />
          <span className="font-bold text-sm">Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-teal-800 text-white pt-14">
          <nav className="px-4 py-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  isActive(to, exact)
                    ? "bg-teal-600 text-white font-semibold"
                    : "text-teal-200 hover:bg-teal-700"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-teal-300 text-sm"
            >
              <ArrowLeft size={16} /> Voltar ao Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-teal-300 hover:text-red-400 text-sm w-full"
            >
              <LogOut size={16} /> Sair
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-0 min-w-0">
        <header className="hidden md:flex bg-white shadow-sm px-6 h-14 items-center justify-between">
          <h1 className="text-gray-800 font-semibold text-sm">
            {navItems.find((n) => isActive(n.to, n.exact))?.label ?? "Admin"}
          </h1>
        </header>

        <main className="flex-1 p-4 md:p-6 mt-14 md:mt-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
