"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
export interface LearnerIdentity {
  id: string;
  kind: "guest" | "account";
}
type SessionState = "loading" | "ready" | "error";
const Context = createContext<{
  user: LearnerIdentity | null;
  state: SessionState;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
} | null>(null);
export function LearnerSessionProvider({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const [user, setUser] = useState<LearnerIdentity | null>(null);
  const [state, setState] = useState<SessionState>("loading");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setState("loading");
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (current !== generation.current) return;
      setUser(data.user || null);
      setState("ready");
    } catch {
      if (current === generation.current) {
        setUser(null);
        setState("error");
      }
    }
  }, []);
  useEffect(() => {
    if (!active) {
      generation.current++;
      return;
    }
    void refresh();
    const recheck = () => {
      void refresh();
    };
    const pageshow = (event: PageTransitionEvent) => {
      if (event.persisted) recheck();
    };
    window.addEventListener("focus", recheck);
    window.addEventListener("pageshow", pageshow);
    const counter = generation;
    return () => {
      counter.current++;
      window.removeEventListener("focus", recheck);
      window.removeEventListener("pageshow", pageshow);
    };
  }, [active, refresh]);
  const signOut = useCallback(async () => {
    const response = await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(
        "Sign out could not be confirmed. Please try again before leaving this shared device.",
      );
    generation.current++;
    setUser(null);
    setState("loading");
    // Remove old UI hints without ever reading them as identity. Storage denial is harmless.
    try {
      localStorage.removeItem("l2e_user_id");
      localStorage.removeItem("l2e_logged_in");
    } catch {}
    window.location.assign("/login?reason=signed-out");
  }, []);
  return (
    <Context.Provider value={{ user, state, refresh, signOut }}>
      {children}
    </Context.Provider>
  );
}
export function useLearnerSession() {
  const context = useContext(Context);
  if (!context) throw new Error("Learner session provider is required.");
  return context;
}
