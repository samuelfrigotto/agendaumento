import React, { createContext, useContext, useState, ReactNode } from "react";

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
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  category: string;
  icon: string;
  active: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

interface AppContextType {
  appointments: Appointment[];
  services: Service[];
  addAppointment: (appt: Omit<Appointment, "id" | "createdAt" | "status">) => string;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;
  addService: (service: Omit<Service, "id">) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  getAvailableSlots: (date: string, serviceId: string) => TimeSlot[];
}

const defaultServices: Service[] = [
  {
    id: "s1",
    name: "General Consultation",
    description: "Comprehensive health check-up and consultation with our veterinarians for your pet.",
    duration: 30,
    price: 75,
    category: "Preventive Care",
    icon: "stethoscope",
    active: true,
  },
  {
    id: "s2",
    name: "Vaccination",
    description: "Core and non-core vaccines to protect your pet from common diseases.",
    duration: 20,
    price: 45,
    category: "Preventive Care",
    icon: "syringe",
    active: true,
  },
  {
    id: "s3",
    name: "Dental Cleaning",
    description: "Professional dental cleaning to maintain your pet's oral health under anesthesia.",
    duration: 90,
    price: 250,
    category: "Dental",
    icon: "tooth",
    active: true,
  },
  {
    id: "s4",
    name: "Grooming",
    description: "Full grooming service including bath, haircut, nail trimming, and ear cleaning.",
    duration: 60,
    price: 65,
    category: "Grooming",
    icon: "scissors",
    active: true,
  },
  {
    id: "s5",
    name: "Spay / Neuter",
    description: "Surgical procedure to prevent reproduction, improving your pet's overall health.",
    duration: 120,
    price: 350,
    category: "Surgery",
    icon: "heart",
    active: true,
  },
  {
    id: "s6",
    name: "X-Ray & Imaging",
    description: "Digital radiography and ultrasound imaging for accurate diagnosis.",
    duration: 45,
    price: 180,
    category: "Diagnostics",
    icon: "scan",
    active: true,
  },
  {
    id: "s7",
    name: "Blood Test & Lab Work",
    description: "Complete blood panel and laboratory analysis for health screening.",
    duration: 30,
    price: 120,
    category: "Diagnostics",
    icon: "flask",
    active: true,
  },
  {
    id: "s8",
    name: "Emergency Care",
    description: "Urgent medical attention for critical conditions requiring immediate treatment.",
    duration: 60,
    price: 200,
    category: "Emergency",
    icon: "ambulance",
    active: true,
  },
];

const defaultAppointments: Appointment[] = [
  {
    id: "a1",
    ownerName: "Sarah Johnson",
    ownerEmail: "sarah@example.com",
    ownerPhone: "(555) 123-4567",
    pet: { name: "Buddy", species: "Dog", breed: "Golden Retriever", age: "3 years" },
    serviceId: "s1",
    serviceName: "General Consultation",
    date: "2026-04-17",
    time: "10:00 AM",
    notes: "Annual checkup",
    status: "confirmed",
    createdAt: "2026-04-10T09:00:00Z",
  },
  {
    id: "a2",
    ownerName: "Michael Chen",
    ownerEmail: "michael@example.com",
    ownerPhone: "(555) 987-6543",
    pet: { name: "Whiskers", species: "Cat", breed: "Persian", age: "5 years" },
    serviceId: "s3",
    serviceName: "Dental Cleaning",
    date: "2026-04-17",
    time: "02:00 PM",
    notes: "First dental cleaning",
    status: "pending",
    createdAt: "2026-04-11T14:00:00Z",
  },
  {
    id: "a3",
    ownerName: "Emily Rodriguez",
    ownerEmail: "emily@example.com",
    ownerPhone: "(555) 456-7890",
    pet: { name: "Luna", species: "Dog", breed: "Labrador Mix", age: "1 year" },
    serviceId: "s2",
    serviceName: "Vaccination",
    date: "2026-04-18",
    time: "11:00 AM",
    notes: "Booster shots needed",
    status: "confirmed",
    createdAt: "2026-04-12T10:00:00Z",
  },
  {
    id: "a4",
    ownerName: "James Wilson",
    ownerEmail: "james@example.com",
    ownerPhone: "(555) 321-0987",
    pet: { name: "Max", species: "Dog", breed: "German Shepherd", age: "4 years" },
    serviceId: "s6",
    serviceName: "X-Ray & Imaging",
    date: "2026-04-19",
    time: "09:00 AM",
    notes: "Limping on front left leg",
    status: "pending",
    createdAt: "2026-04-13T08:00:00Z",
  },
  {
    id: "a5",
    ownerName: "Lisa Thompson",
    ownerEmail: "lisa@example.com",
    ownerPhone: "(555) 654-3210",
    pet: { name: "Mochi", species: "Cat", breed: "Siamese", age: "2 years" },
    serviceId: "s4",
    serviceName: "Grooming",
    date: "2026-04-20",
    time: "03:00 PM",
    notes: "",
    status: "pending",
    createdAt: "2026-04-14T11:00:00Z",
  },
  {
    id: "a6",
    ownerName: "David Park",
    ownerEmail: "david@example.com",
    ownerPhone: "(555) 789-0123",
    pet: { name: "Coco", species: "Rabbit", breed: "Holland Lop", age: "1 year" },
    serviceId: "s1",
    serviceName: "General Consultation",
    date: "2026-04-16",
    time: "01:00 PM",
    notes: "Not eating well",
    status: "completed",
    createdAt: "2026-04-09T09:00:00Z",
  },
];

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM",
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(defaultAppointments);
  const [services, setServices] = useState<Service[]>(defaultServices);

  const addAppointment = (appt: Omit<Appointment, "id" | "createdAt" | "status">): string => {
    const id = `a${Date.now()}`;
    const newAppt: Appointment = {
      ...appt,
      id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => [...prev, newAppt]);
    return id;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const addService = (service: Omit<Service, "id">) => {
    const id = `s${Date.now()}`;
    setServices((prev) => [...prev, { ...service, id }]);
  };

  const updateService = (id: string, service: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...service } : s))
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const getAvailableSlots = (date: string, serviceId: string): TimeSlot[] => {
    const bookedTimes = appointments
      .filter((a) => a.date === date && a.status !== "cancelled")
      .map((a) => a.time);

    return TIME_SLOTS.map((time) => ({
      time,
      available: !bookedTimes.includes(time),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        appointments,
        services,
        addAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        addService,
        updateService,
        deleteService,
        getAvailableSlots,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
