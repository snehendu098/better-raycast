import { useEffect, useState, useCallback } from "react";
import { LocalStorage, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { getBalance } from "../actions/aptos";
import { getAccountFromPrivateKey, getSelectedNetwork } from "../utils/aptos";
import { NetworkType } from "../types";

interface UseWalletResult {
  privateKey: string | null;
  address: string | null;
  balance: number | null;
  network: NetworkType;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  handleWalletSetup: (key: string) => Promise<void>;
  handleNetworkChange: (newNetwork: NetworkType) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export function useWallet(): UseWalletResult {
  const [isLoading, setIsLoading] = useState(true);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [network, setNetwork] = useState<NetworkType>("testnet");

  const loadWalletAndNetwork = useCallback(async () => {
    const savedNetwork = await getSelectedNetwork();
    setNetwork(savedNetwork);

    const storedKey = await LocalStorage.getItem<string>("privateKey");

    if (storedKey) {
      setPrivateKey(storedKey);

      try {
        const account = getAccountFromPrivateKey(storedKey);
        const addr = account.accountAddress.toString();
        setAddress(addr);

        const bal = await getBalance(addr, savedNetwork);
        setBalance(bal);
      } catch (error) {
        console.error("Error loading wallet:", error);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadWalletAndNetwork();
  }, [loadWalletAndNetwork]);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    const bal = await getBalance(address, network);
    setBalance(bal);
    setIsLoading(false);
    await showToast({ style: Toast.Style.Success, title: "Balance refreshed" });
  }, [address, network]);

  const handleWalletSetup = useCallback(
    async (key: string) => {
      setPrivateKey(key);
      const account = getAccountFromPrivateKey(key);
      const addr = account.accountAddress.toString();
      setAddress(addr);
      const bal = await getBalance(addr, network);
      setBalance(bal);
    },
    [network]
  );

  const handleNetworkChange = useCallback(
    async (newNetwork: NetworkType) => {
      setNetwork(newNetwork);
      if (address) {
        setIsLoading(true);
        const bal = await getBalance(address, newNetwork);
        setBalance(bal);
        setIsLoading(false);
      }
    },
    [address]
  );

  const handleLogout = useCallback(async () => {
    const confirmed = await confirmAlert({
      title: "Logout",
      message: "Are you sure you want to remove your wallet?",
      primaryAction: {
        title: "Logout",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      await LocalStorage.removeItem("privateKey");
      setPrivateKey(null);
      setAddress(null);
      setBalance(null);
    }
  }, []);

  return {
    privateKey,
    address,
    balance,
    network,
    isLoading,
    refreshBalance,
    handleWalletSetup,
    handleNetworkChange,
    handleLogout,
  };
}
