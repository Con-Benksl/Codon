import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentUser, login, logout, type User } from "../api/auth";
import { AUTH_UNAUTHORIZED_EVENT } from "./events";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: User | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hasStoredToken() {
  try {
    return Boolean(localStorage.getItem("access_token"));
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  const setUnauthenticated = useCallback(() => {
    setState({ status: "unauthenticated", user: null });
  }, []);

  const setAuthenticated = useCallback((user: User) => {
    setState({ status: "authenticated", user });
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await getCurrentUser();
    setAuthenticated(user);
  }, [setAuthenticated]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
      await refreshUser();
    },
    [refreshUser],
  );

  const signOut = useCallback(() => {
    logout();
    setUnauthenticated();
  }, [setUnauthenticated]);

  useEffect(() => {
    let disposed = false;

    const bootstrap = async () => {
      if (!hasStoredToken()) {
        if (!disposed) setUnauthenticated();
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!disposed) setAuthenticated(user);
      } catch {
        try {
          localStorage.removeItem("access_token");
        } catch {
          // ignore storage errors
        }
        if (!disposed) setUnauthenticated();
      }
    };

    void bootstrap();

    const handleUnauthorized = () => {
      setUnauthenticated();
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      disposed = true;
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [setAuthenticated, setUnauthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      isAuthenticated: state.status === "authenticated",
      signIn,
      signOut,
      refreshUser,
    }),
    [state.status, state.user, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

