import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { getUser, saveUser, clearUser, initializeStorage } from "@/utils/storage";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initializeStorage();
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const login = (email: string, password: string, role: UserRole) => {
    const newUser: User = {
      token: "fake-token-" + Date.now(),
      role,
      email,
      fullName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
    };
    saveUser(newUser);
    setUser(newUser);
  };

  const logout = () => {
    clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
