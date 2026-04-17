import { createBrowserRouter } from "react-router";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "services", Component: Services },
      { path: "book", Component: BookAppointment },
      { path: "my-appointments", Component: MyAppointments },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "appointments", Component: AdminAppointments },
      { path: "services", Component: AdminServices },
      { path: "settings", Component: AdminSettings },
    ],
  },
]);
