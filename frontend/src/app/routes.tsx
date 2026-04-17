import { createBrowserRouter, Navigate } from "react-router";
import { type ReactNode } from "react";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { BookAppointment } from "./pages/BookAppointment";
import { MyAppointments } from "./pages/MyAppointments";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminAppointments } from "./pages/admin/Appointments";
import { AdminServices } from "./pages/admin/Services";
import { AdminSettings } from "./pages/admin/Settings";
import { AdminFinancial } from "./pages/admin/Financial";
import { AdminLogin } from "./pages/admin/Login";
import { useAuth } from "./context/AuthContext";

function AdminGuard({ children }: { children: ReactNode }) {
  const { adminToken } = useAuth();
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function AdminLayoutGuarded() {
  const { adminToken } = useAuth();
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return <AdminLayout />;
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/servicos", element: <Services /> },
      { path: "/agendar", element: <BookAppointment /> },
      { path: "/meus-agendamentos", element: <MyAppointments /> },
    ],
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
    element: <AdminLayoutGuarded />,
    children: [
      { index: true, element: <AdminGuard><AdminDashboard /></AdminGuard> },
      { path: "agendamentos", element: <AdminGuard><AdminAppointments /></AdminGuard> },
      { path: "servicos", element: <AdminGuard><AdminServices /></AdminGuard> },
      { path: "financeiro", element: <AdminGuard><AdminFinancial /></AdminGuard> },
      { path: "configuracoes", element: <AdminGuard><AdminSettings /></AdminGuard> },
    ],
  },
]);
