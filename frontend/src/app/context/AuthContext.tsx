import { createContext, useContext, useState, ReactNode } from "react";
import { adminLogin, clienteLogin, clienteRegistrar, type ClienteUser } from "@/services/api";

interface AdminUser {
  id: number;
  nome: string;
  email: string;
}

interface AuthContextType {
  // Admin
  adminToken: string | null;
  adminUser: AdminUser | null;
  loginAdmin: (email: string, senha: string) => Promise<void>;
  logoutAdmin: () => void;
  // Client
  clientToken: string | null;
  clientUser: ClienteUser | null;
  loginClient: (cpf: string, senha: string) => Promise<void>;
  registerClient: (nome: string, cpf: string, telefone: string, senha: string, email?: string) => Promise<void>;
  logoutClient: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_USER_KEY = "adminUser";
const CLIENT_TOKEN_KEY = "clientToken";
const CLIENT_USER_KEY = "clientUser";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(
    () => localStorage.getItem(ADMIN_TOKEN_KEY)
  );
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const s = localStorage.getItem(ADMIN_USER_KEY);
    return s ? JSON.parse(s) : null;
  });
  const [clientToken, setClientToken] = useState<string | null>(
    () => localStorage.getItem(CLIENT_TOKEN_KEY)
  );
  const [clientUser, setClientUser] = useState<ClienteUser | null>(() => {
    const s = localStorage.getItem(CLIENT_USER_KEY);
    return s ? JSON.parse(s) : null;
  });

  const loginAdmin = async (email: string, senha: string) => {
    const res = await adminLogin(email, senha);
    localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(res.admin));
    setAdminToken(res.token);
    setAdminUser(res.admin);
  };

  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAdminToken(null);
    setAdminUser(null);
  };

  const loginClient = async (cpf: string, senha: string) => {
    const res = await clienteLogin(cpf, senha);
    localStorage.setItem(CLIENT_TOKEN_KEY, res.token);
    localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(res.cliente));
    setClientToken(res.token);
    setClientUser(res.cliente);
  };

  const registerClient = async (nome: string, cpf: string, telefone: string, senha: string, email?: string) => {
    const res = await clienteRegistrar(nome, cpf, telefone, senha, email);
    localStorage.setItem(CLIENT_TOKEN_KEY, res.token);
    localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(res.cliente));
    setClientToken(res.token);
    setClientUser(res.cliente);
  };

  const logoutClient = () => {
    localStorage.removeItem(CLIENT_TOKEN_KEY);
    localStorage.removeItem(CLIENT_USER_KEY);
    setClientToken(null);
    setClientUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        adminToken,
        adminUser,
        loginAdmin,
        logoutAdmin,
        clientToken,
        clientUser,
        loginClient,
        registerClient,
        logoutClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
