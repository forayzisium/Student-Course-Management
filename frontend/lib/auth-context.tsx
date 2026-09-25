"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  isSuperAdmin?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem("scm_token");
      const storedUser = localStorage.getItem("scm_user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("scm_token");
          localStorage.removeItem("scm_user");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole,
  ): Promise<User> => {
    localStorage.removeItem("scm_token");
    localStorage.removeItem("scm_user");

    let response;
    try {
      response = await apiFetch<{
        success: boolean;
        token: string;
        user: User;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
        skipAuthRedirect: true,
      });
    } catch (error) {
      localStorage.removeItem("scm_token");
      localStorage.removeItem("scm_user");
      throw error;
    }

    if (!response.success) {
      localStorage.removeItem("scm_token");
      localStorage.removeItem("scm_user");
      throw new Error("Login failed");
    }

    localStorage.setItem("scm_token", response.token);
    localStorage.setItem("scm_user", JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);

    return response.user;
  };

  const logout = () => {
    localStorage.removeItem("scm_token");
    localStorage.removeItem("scm_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await apiFetch<{
        success: boolean;
        user: User;
      }>("/auth/me", { token });

      if (response.success) {
        setUser(response.user);
        localStorage.setItem("scm_user", JSON.stringify(response.user));
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
