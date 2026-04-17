import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router";
import {
  PawPrint, LayoutDashboard, Calendar, Scissors, Settings,
  Menu, X, ChevronRight, LogOut, Bell
} from "lucide-react";
import { useApp } from "../context/AppContext";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { appointments } = useApp();
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Appointments", href: "/admin/appointments", icon: Calendar },
    { label: "Services", href: "/admin/services", icon: Scissors },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-teal-700/50">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <PawPrint size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white" style={{ fontWeight: 700, fontSize: "0.95rem" }}>Paws Vet</p>
            <p className="text-teal-300" style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}>ADMIN PORTAL</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              isActive(href)
                ? "bg-white text-teal-700"
                : "text-teal-100 hover:bg-teal-700/60 hover:text-white"
            }`}
            style={{ fontWeight: isActive(href) ? 600 : 400 }}
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === "Appointments" && pendingCount > 0 && (
              <span className="ml-auto bg-amber-400 text-amber-900 text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
            {isActive(href) && <ChevronRight size={14} className="ml-auto text-teal-500" />}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-teal-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 700 }}>
            DR
          </div>
          <div>
            <p className="text-white text-xs" style={{ fontWeight: 600 }}>Dr. Rebecca Smith</p>
            <p className="text-teal-300" style={{ fontSize: "0.65rem" }}>Administrator</p>
          </div>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 text-teal-300 hover:text-white text-xs transition-colors px-2 py-1.5"
        >
          <LogOut size={14} />
          Back to Website
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-teal-800 flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-teal-800 flex flex-col">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            className="md:hidden text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-800" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {navItems.find((n) => isActive(n.href))?.label ?? "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="relative">
                <Bell size={20} className="text-gray-500" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-amber-900 text-xs rounded-full flex items-center justify-center" style={{ fontWeight: 700, fontSize: "0.6rem" }}>
                  {pendingCount}
                </span>
              </div>
            )}
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 700 }}>
              DR
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
