"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/libs/api";

interface User {
  id: number;
  nombre: string;
  email?: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      await api.get("/backoffice/patients", { params: { limit: 1 } });
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed: User = JSON.parse(saved);
        parsed.rol = (parsed.rol || "").toUpperCase();
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user } = response.data || {};
      if (access_token && user) {
        localStorage.setItem("token", access_token);
        const mappedUser: User = {
          id: Number(user.id),
          nombre: user.name,
          email: user.email,
          rol: (user.role || "").toUpperCase(),
        };
        localStorage.setItem("user", JSON.stringify(mappedUser));
        setUser(mappedUser);
        router.push("/admin");
      } else {
        throw new Error("Respuesta de login inválida");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Error al iniciar sesión");
      }
      throw new Error("Error al iniciar sesión");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
