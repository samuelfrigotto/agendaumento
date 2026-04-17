import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { fetchServicos, mapService } from "@/services/api";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Pet {
  name: string;
  species: string;
  breed: string;
  age: string;
}

export interface Appointment {
  id: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  pet: Pet;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  icon: string;
  active: boolean;
}

interface AppContextType {
  services: Service[];
  loadingServices: boolean;
  refetchServices: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const refetchServices = useCallback(async () => {
    try {
      const data = await fetchServicos();
      setServices(data.map(mapService));
    } catch {
      // Silently fail — pages can handle errors individually
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    refetchServices();
  }, [refetchServices]);

  return (
    <AppContext.Provider value={{ services, loadingServices, refetchServices }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
