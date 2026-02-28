import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  balance: number | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  shortAddress: string | null;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  balance: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  shortAddress: null,
});

export const useWallet = () => useContext(WalletContext);

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const connection = new Connection(SOLANA_RPC);
      const pubKey = new PublicKey(address);
      const bal = await connection.getBalance(pubKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, []);

  const connect = useCallback(async () => {
    const phantom = (window as any).solana;
    if (!phantom?.isPhantom) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    setConnecting(true);
    try {
      const resp = await phantom.connect();
      const addr = resp.publicKey.toString();
      setPublicKey(addr);
      fetchBalance(addr);
    } catch {
      // user rejected
    }
    setConnecting(false);
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    const phantom = (window as any).solana;
    phantom?.disconnect?.();
    setPublicKey(null);
    setBalance(null);
  }, []);

  // Auto-reconnect
  useEffect(() => {
    const phantom = (window as any).solana;
    if (phantom?.isPhantom) {
      phantom.connect({ onlyIfTrusted: true }).then((resp: any) => {
        const addr = resp.publicKey.toString();
        setPublicKey(addr);
        fetchBalance(addr);
      }).catch(() => {});
    }
  }, [fetchBalance]);

  const connected = !!publicKey;
  const shortAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  return (
    <WalletContext.Provider value={{ connected, publicKey, balance, connecting, connect, disconnect, shortAddress }}>
      {children}
    </WalletContext.Provider>
  );
};
