import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { getExplorerUrl } from "../../utils/aptos";
import { NetworkType } from "../../types";

import { FAUCET_URL } from "../../constants";
import TransferForm from "./TransferForm";
import TransactionHistory from "./TransactionHistory";
import AccountDetails from "./AccountDetails";
import AllBalances from "./AllBalances";
import NFTGallery from "./NFTGallery";
import SignMessage from "./SignMessage";
import ANSLookup from "./ANSLookup";
import CheckAddress from "./CheckAddress";
import TokenDataLookup from "./TokenDataLookup";
import FungibleAssetMetadataLookup from "./FungibleAssetMetadataLookup";

interface WalletActionsProps {
  privateKey: string;
  address: string;
  balance: number;
  network: NetworkType;
  onTransferComplete: () => Promise<void>;
  onNetworkChange: (network: NetworkType) => Promise<void>;
}

export default function WalletActions({
  privateKey,
  address,
  balance,
  network,
  onTransferComplete,
  onNetworkChange,
}: WalletActionsProps) {
  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <List.Section title="Basic Actions">
      <List.Item
        icon={Icon.ArrowNe}
        title="Send APT"
        subtitle={`Transfer APT on ${networkLabel}`}
        actions={
          <ActionPanel>
            <Action.Push
              title="Send APT"
              icon={Icon.ArrowNe}
              target={
                <TransferForm
                  privateKey={privateKey}
                  senderAddress={address}
                  currentBalance={balance}
                  network={network}
                  onTransferComplete={onTransferComplete}
                  onNetworkChange={onNetworkChange}
                />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.List}
        title="Transaction History"
        subtitle="View recent transactions"
        actions={
          <ActionPanel>
            <Action.Push
              title="Transaction History"
              icon={Icon.List}
              target={<TransactionHistory address={address} network={network} />}
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Person}
        title="Account Details"
        subtitle="View account details of your address"
        actions={
          <ActionPanel>
            <Action.Push
              title="Account Details"
              icon={Icon.Person}
              target={<AccountDetails address={address} network={network} />}
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Coins}
        title="All Balances"
        subtitle="View all coin balances"
        actions={
          <ActionPanel>
            <Action.Push
              title="All Balances"
              icon={Icon.Coins}
              target={<AllBalances address={address} network={network} />}
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Image}
        title="NFT Gallery"
        subtitle="View your NFTs"
        actions={
          <ActionPanel>
            <Action.Push
              title="NFT Gallery"
              icon={Icon.Image}
              target={<NFTGallery address={address} network={network} />}
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Pencil}
        title="Sign Message"
        subtitle="Sign a message with your key"
        actions={
          <ActionPanel>
            <Action.Push title="Sign Message" icon={Icon.Pencil} target={<SignMessage privateKey={privateKey} />} />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.MagnifyingGlass}
        title="ANS Lookup"
        subtitle="Look up ANS names and addresses"
        actions={
          <ActionPanel>
            <Action.Push title="ANS Lookup" icon={Icon.MagnifyingGlass} target={<ANSLookup network={network} />} />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Eye}
        title="Account Lookup with address or ANS"
        subtitle="View account details of any arbitary account or ans"
        actions={
          <ActionPanel>
            <Action.Push title="Check Address" icon={Icon.Eye} target={<CheckAddress network={network} />} />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Eye}
        title="Token Data Lookup"
        subtitle="View complete NFT token data"
        actions={
          <ActionPanel>
            <Action.Push
              title="Token Data Lookup"
              icon={Icon.Eye}
              target={<TokenDataLookup network={network} onNetworkChange={onNetworkChange} />}
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Eye}
        title="Fungible Asset Metadata"
        subtitle="View fungible asset or coin metadata"
        actions={
          <ActionPanel>
            <Action.Push
              title="Fungible Asset Metadata"
              icon={Icon.Eye}
              target={<FungibleAssetMetadataLookup network={network} onNetworkChange={onNetworkChange} />}
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Globe}
        title="View on Explorer"
        subtitle="Open in Aptos Explorer"
        actions={
          <ActionPanel>
            <Action.OpenInBrowser title="Open Explorer" url={getExplorerUrl("account", address, network)} />
          </ActionPanel>
        }
      />
      {network === "testnet" && (
        <List.Item
          icon={Icon.Download}
          title="Get Testnet APT"
          subtitle="Open Aptos Faucet"
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open Faucet" url={FAUCET_URL} />
              <Action.CopyToClipboard title="Copy Address for Faucet" content={address} />
            </ActionPanel>
          }
        />
      )}
    </List.Section>
  );
}
