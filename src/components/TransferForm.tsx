import {
  ActionPanel,
  Action,
  Form,
  useNavigation,
  showToast,
  Toast,
  Detail,
  Icon,
  confirmAlert,
  Alert,
} from "@raycast/api";
import { useState } from "react";
import {
  transferAPT,
  formatAddress,
  getExplorerUrl,
  getAddressFromName,
  getBalance,
  setSelectedNetwork,
} from "../utils/aptos";
import { NetworkType } from "../types";
import { MIN_ADDRESS_LENGTH, BALANCE_DISPLAY_DECIMALS, ADDRESS_PREFIX } from "../constants";

/**
 * Check if input is an ANS name (ends with .apt)
 */
function isANSName(input: string): boolean {
  return input.toLowerCase().endsWith(".apt");
}

/**
 * Check if input is a valid Aptos address
 */
function isValidAddress(input: string): boolean {
  return input.startsWith(ADDRESS_PREFIX) && input.length >= MIN_ADDRESS_LENGTH;
}

interface TransferFormProps {
  privateKey: string;
  senderAddress: string;
  currentBalance: number;
  network: NetworkType;
  onTransferComplete: () => void;
  onNetworkChange: (network: NetworkType) => Promise<void>;
}

export default function TransferForm({
  privateKey,
  senderAddress,
  currentBalance,
  network,
  onTransferComplete,
  onNetworkChange,
}: TransferFormProps) {
  const { pop, push } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNetwork, setSelectedNetworkState] = useState<NetworkType>(network);
  const [balance, setBalance] = useState<number>(currentBalance);

  async function handleNetworkChange(newNetwork: NetworkType) {
    setSelectedNetworkState(newNetwork);
    await setSelectedNetwork(newNetwork);
    await onNetworkChange(newNetwork);

    // Fetch balance for new network
    const newBalance = await getBalance(senderAddress, newNetwork);
    setBalance(newBalance);
  }

  async function handleSubmit(values: { recipient: string; amount: string }) {
    const recipientInput = values.recipient?.trim() || "";

    // Validate recipient format (must be address or ANS name)
    if (!recipientInput) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Recipient",
        message: "Please enter an address or ANS name",
      });
      return;
    }

    const isANS = isANSName(recipientInput);
    const isAddress = isValidAddress(recipientInput);

    if (!isANS && !isAddress) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Recipient",
        message: "Enter a valid address (0x...) or ANS name (name.apt)",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount <= 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Amount",
        message: "Please enter a valid positive number",
      });
      return;
    }

    if (amount > balance) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Insufficient Balance",
        message: `You only have ${balance.toFixed(BALANCE_DISPLAY_DECIMALS)} APT`,
      });
      return;
    }

    setIsSubmitting(true);

    // Resolve ANS name to address if needed
    let resolvedAddress: string;
    let ansName: string | null = null;

    if (isANS) {
      await showToast({ style: Toast.Style.Animated, title: "Resolving ANS name..." });

      try {
        const address = await getAddressFromName(recipientInput, selectedNetwork);
        if (!address) {
          await showToast({
            style: Toast.Style.Failure,
            title: "ANS Resolution Failed",
            message: `Could not find address for "${recipientInput}"`,
          });
          setIsSubmitting(false);
          return;
        }
        resolvedAddress = address;
        ansName = recipientInput;
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "ANS Resolution Failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        setIsSubmitting(false);
        return;
      }
    } else {
      resolvedAddress = recipientInput;
    }

    // Build confirmation message
    const recipientDisplay = ansName
      ? `${ansName} (${formatAddress(resolvedAddress)})`
      : formatAddress(resolvedAddress);

    const confirmMessage = `Send ${amount} APT to ${recipientDisplay}?`;

    // Confirm transaction
    const confirmed = await confirmAlert({
      title: "Confirm Transfer",
      message: confirmMessage,
      primaryAction: {
        title: "Send",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) {
      setIsSubmitting(false);
      return;
    }

    // Execute transfer
    await showToast({ style: Toast.Style.Animated, title: "Sending..." });

    try {
      const result = await transferAPT(privateKey, resolvedAddress, amount, selectedNetwork);

      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Transfer Successful!",
          message: `Hash: ${result.hash.slice(0, 10)}...`,
        });

        // Show success screen
        push(
          <TransferSuccess
            amount={amount}
            recipient={resolvedAddress}
            ansName={ansName}
            hash={result.hash}
            network={selectedNetwork}
            onDone={() => {
              onTransferComplete();
              pop();
              pop();
            }}
          />,
        );
      } else {
        throw new Error("Transaction failed on chain");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await showToast({
        style: Toast.Style.Failure,
        title: "Transfer Failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send APT" icon={Icon.ArrowNe} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Send APT"
        text={`From: ${formatAddress(senderAddress)} | Balance: ${balance.toFixed(BALANCE_DISPLAY_DECIMALS)} APT`}
      />
      <Form.Dropdown
        id="network"
        title="Network"
        value={selectedNetwork}
        onChange={(value) => handleNetworkChange(value as NetworkType)}
      >
        <Form.Dropdown.Item value="testnet" title="Testnet" />
        <Form.Dropdown.Item value="mainnet" title="Mainnet" />
        <Form.Dropdown.Item value="devnet" title="Devnet" />
      </Form.Dropdown>
      <Form.TextField
        id="recipient"
        title="Recipient"
        placeholder="0x... or name.apt"
        info="Enter an Aptos address or ANS name (e.g., alice.apt)"
      />
      <Form.TextField id="amount" title="Amount (APT)" placeholder="0.1" info="Amount of APT to send" />
    </Form>
  );
}

// Success screen component
function TransferSuccess({
  amount,
  recipient,
  ansName,
  hash,
  network,
  onDone,
}: {
  amount: number;
  recipient: string;
  ansName: string | null;
  hash: string;
  network: NetworkType;
  onDone: () => void;
}) {
  const explorerUrl = getExplorerUrl("txn", hash, network);

  const recipientSection = ansName
    ? `**Recipient:**
\`${ansName}\`

**Resolved Address:**
\`${recipient}\``
    : `**Recipient:**
\`${recipient}\``;

  return (
    <Detail
      markdown={`# ✅ Transfer Successful!

**Network:** ${network === "mainnet" ? "🔴 Mainnet" : "🟢 Testnet"}

**Amount:** ${amount} APT

${recipientSection}

**Transaction Hash:**
\`${hash}\`

---

[View on Explorer](${explorerUrl})
`}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="View on Explorer" url={explorerUrl} />
          <Action.CopyToClipboard title="Copy Transaction Hash" content={hash} />
          <Action.CopyToClipboard title="Copy Recipient Address" content={recipient} />
          <Action title="Done" onAction={onDone} />
        </ActionPanel>
      }
    />
  );
}
