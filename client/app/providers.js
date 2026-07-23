"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

const AuthContext = createContext(null);
const storageKey = "property-rental-auth";

function getStoredAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch (_error) {
    return null;
  }
}

function saveStoredAuth(auth) {
  window.localStorage.setItem(storageKey, JSON.stringify(auth));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedAuth = getStoredAuth();

    if (storedAuth?.token && storedAuth?.user) {
      setToken(storedAuth.token);
      setUser(storedAuth.user);
    }

    setIsReady(true);
  }, []);

  async function register(formData) {
    const payload = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(formData)
    });

    // Registration does not return a token — user must verify email first
    return payload.data.user;
  }

  async function login(formData) {
    const payload = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(formData)
    });

    setToken(payload.data.token);
    setUser(payload.data.user);
    saveStoredAuth(payload.data);
    return payload.data.user;
  }

  function logout() {
    window.localStorage.removeItem(storageKey);
    setToken(null);
    setUser(null);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
    const storedAuth = getStoredAuth();

    if (storedAuth) {
      saveStoredAuth({ ...storedAuth, user: nextUser });
    }
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token && user),
      isReady,
      login,
      logout,
      register,
      token,
      updateUser,
      user
    }),
    [isReady, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
