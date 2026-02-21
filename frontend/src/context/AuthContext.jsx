import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const USER_ROLES = {
  MANAGER: "manager",
  DISPATCHER: "dispatcher",
  SAFETY_OFFICER: "safety_officer",
  FINANCIAL_ANALYST: "financial_analyst",
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Check authentication on app load
  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      if (response.data.status) {
        setUser(response.data.user);
      }
    } catch (error) {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 🔹 Login
  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });

    if (response.data.status) {
      setUser(response.data.user);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
    }

    return response.data;
  };

  // 🔹 Register
  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);

    if (response.data.status && response.data.user) {
      setUser(response.data.user);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
    }

    return response.data;
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      localStorage.removeItem("token");
    }
  };

  // 🔥 ROLE CHECK HELPERS
  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isManager = () => user?.role === USER_ROLES.MANAGER;
  const isDispatcher = () => user?.role === USER_ROLES.DISPATCHER;
  const isSafetyOfficer = () => user?.role === USER_ROLES.SAFETY_OFFICER;
  const isFinancialAnalyst = () => user?.role === USER_ROLES.FINANCIAL_ANALYST;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        hasRole,
        isManager,
        isDispatcher,
        isSafetyOfficer,
        isFinancialAnalyst,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);