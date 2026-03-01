import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  login: () => void;
  logout: () => void;
  authenticated: boolean;
  userDisplay: string | null;
  user: User | null;
}

const AuthContext = createContext<AuthContextType>({
  login: () => {},
  logout: () => {},
  authenticated: false,
  userDisplay: null,
  user: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = () => {
    window.location.href = "/auth";
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const authenticated = !!user;
  const userDisplay = user?.email ?? (authenticated ? "Signed in" : null);

  return (
    <AuthContext.Provider value={{ login, logout, authenticated, userDisplay, user }}>
      {children}
    </AuthContext.Provider>
  );
};
