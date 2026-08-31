import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getClient } from "../api/graphqlClient";
import { LOGIN_MUTATION, REGISTER_MUTATION } from "../api/queries";

type User = { id: string; email: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Owns authentication state for the whole React tree. It exposes auth actions
 * and restores the saved public user and JWT when the page is refreshed.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Keeps the JWT in browser storage whenever the in-memory token changes.
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // Keeps the public user profile in browser storage for page refreshes.
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  /** Sends the login mutation, then stores the returned JWT and public user. */
  async function login(email: string, password: string) {
    const client = getClient();
    const data: any = await client.request(LOGIN_MUTATION, { email, password });
    setToken(data.login.token);
    setUser(data.login.user);
  }

  /** Creates an account through GraphQL, then signs in with the returned payload. */
  async function register(email: string, password: string) {
    const client = getClient();
    const data: any = await client.request(REGISTER_MUTATION, { email, password });
    setToken(data.register.token);
    setUser(data.register.user);
  }

  /** Clears React auth state; the effects above also remove persisted browser data. */
  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Gives components typed access to AuthProvider and detects use outside the provider. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
