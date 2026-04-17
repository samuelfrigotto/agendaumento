import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { fetchServicos, mapService, fetchConfiguracoesPublico } from "@/services/api";

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

export interface ClinicInfo {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  horarioSegSexInicio: string;
  horarioSegSexFim: string;
  horarioSabInicio: string;
  horarioSabFim: string;
  domingoAberto: boolean;
}

export const defaultClinicInfo: ClinicInfo = {
  nome: "Agendaumento",
  telefone: "(11) 3333-4444",
  email: "contato@agendaumento.com.br",
  endereco: "Rua das Flores, 123 — São Paulo, SP",
  horarioSegSexInicio: "08:00",
  horarioSegSexFim: "18:00",
  horarioSabInicio: "09:00",
  horarioSabFim: "16:00",
  domingoAberto: false,
};

interface AppContextType {
  services: Service[];
  loadingServices: boolean;
  refetchServices: () => Promise<void>;
  clinicInfo: ClinicInfo;
  refetchClinicInfo: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(defaultClinicInfo);

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

  const refetchClinicInfo = useCallback(async () => {
    try {
      const map = await fetchConfiguracoesPublico();
      setClinicInfo({
        nome: map.clinic_nome ?? defaultClinicInfo.nome,
        telefone: map.clinic_telefone ?? defaultClinicInfo.telefone,
        email: map.clinic_email ?? defaultClinicInfo.email,
        endereco: map.clinic_endereco ?? defaultClinicInfo.endereco,
        horarioSegSexInicio: map.clinic_horario_seg_sex_inicio ?? defaultClinicInfo.horarioSegSexInicio,
        horarioSegSexFim: map.clinic_horario_seg_sex_fim ?? defaultClinicInfo.horarioSegSexFim,
        horarioSabInicio: map.clinic_horario_sab_inicio ?? defaultClinicInfo.horarioSabInicio,
        horarioSabFim: map.clinic_horario_sab_fim ?? defaultClinicInfo.horarioSabFim,
        domingoAberto: map.clinic_domingo_aberto === "true",
      });
    } catch {
      // keep defaults on error
    }
  }, []);

  useEffect(() => {
    refetchServices();
    refetchClinicInfo();
  }, [refetchServices, refetchClinicInfo]);

  return (
    <AppContext.Provider value={{ services, loadingServices, refetchServices, clinicInfo, refetchClinicInfo }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
