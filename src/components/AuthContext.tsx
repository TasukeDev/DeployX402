import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AuthContextType {
  login: () => void;
  logout: () => void;
  authenticated: boolean;
  userDisplay: string | null;
}

const AuthContext = createContext<AuthContextType>({
  login: () => {},
  logout: () => {},
  authenticated: false,
  userDisplay: null,
});

export const useAuth = () => useContext(AuthContext);

interface Props {
  children: ReactNode;
}

/**
 * Wraps Privy auth when configured, otherwise provides a no-op context.
 * The PrivyAuthProvider is used in App.tsx only when Privy is enabled.
 */
export const FallbackAuthProvider = ({ children }: Props) => {
  return (
    <AuthContext.Provider value={{ login: () => {}, logout: () => {}, authenticated: false, userDisplay: null }}>
      {children}
    </AuthContext.Provider>
  );
};

export const PrivyAuthBridge = ({ children }: Props) => {
  // This component must be rendered inside PrivyProvider
  const { usePrivy } = require("@privy-io/react-auth");
  const { login, logout, authenticated, user } = usePrivy();

  const userDisplay = user?.email?.address || user?.wallet?.address?.slice(0, 8) + "..." || (authenticated ? "Connected" : null);

  return (
    <AuthContext.Provider value={{ login, logout, authenticated, userDisplay }}>
      {children}
    </AuthContext.Provider>
  );
};
