import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';

export interface User {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
}

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenants: TenantInfo[];
  currentTenant: TenantInfo | null;
  loading: boolean;
  login: (token: string, user: User, tenants: TenantInfo[]) => void;
  logout: () => void;
  setCurrentTenant: (tenant: TenantInfo) => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('reception_token'));
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [currentTenant, setCurrentTenantState] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const setCurrentTenant = (tenant: TenantInfo) => {
    setCurrentTenantState(tenant);
    localStorage.setItem('reception_active_tenant_id', tenant.id);
  };

  const login = (newToken: string, newUser: User, newTenants: TenantInfo[]) => {
    setToken(newToken);
    setUser(newUser);
    setTenants(newTenants);
    localStorage.setItem('reception_token', newToken);

    if (newTenants.length > 0) {
      const savedTenantId = localStorage.getItem('reception_active_tenant_id');
      const found = newTenants.find((t) => t.id === savedTenantId) || newTenants[0];
      setCurrentTenant(found);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTenants([]);
    setCurrentTenantState(null);
    localStorage.removeItem('reception_token');
    localStorage.removeItem('reception_active_tenant_id');
  };

  const refreshMe = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest<{ user: User; tenants: TenantInfo[] }>('/auth/me');
      setUser(data.user);
      setTenants(data.tenants);

      if (data.tenants.length > 0) {
        const savedTenantId = localStorage.getItem('reception_active_tenant_id');
        const found = data.tenants.find((t) => t.id === savedTenantId) || data.tenants[0];
        setCurrentTenantState(found);
      }
    } catch (err) {
      console.warn('Session expired or invalid token');
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenants,
        currentTenant,
        loading,
        login,
        logout,
        setCurrentTenant,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
