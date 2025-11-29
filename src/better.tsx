import { List } from "@raycast/api";
import { useWallet } from "./hooks";
import {
  NetworkBanner,
  WalletInfo,
  WalletActions,
  WalletSettings,
  EmptyWalletView,
} from "./components";

export default function Command() {
  const {
    privateKey,
    address,
    balance,
    network,
    isLoading,
    refreshBalance,
    handleWalletSetup,
    handleNetworkChange,
    handleLogout,
  } = useWallet();

  if (isLoading) {
    return <List isLoading={true} />;
  }

  if (!privateKey) {
    return (
      <List>
        <EmptyWalletView
          network={network}
          onWalletSetup={handleWalletSetup}
          onNetworkChange={handleNetworkChange}
        />
      </List>
    );
  }

  return (
    <List>
      <NetworkBanner network={network} onNetworkChange={handleNetworkChange} />
      <WalletInfo
        address={address || ""}
        balance={balance}
        network={network}
        onRefreshBalance={refreshBalance}
      />
      <WalletSettings
        network={network}
        onNetworkChange={handleNetworkChange}
        onLogout={handleLogout}
      />
      <WalletActions
        privateKey={privateKey}
        address={address || ""}
        balance={balance || 0}
        network={network}
        onTransferComplete={refreshBalance}
        onNetworkChange={handleNetworkChange}
      />
    </List>
  );
}
