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
import { stakeTokens } from "../../actions/amnis/stake-token";
import { formatAddress, getExplorerUrl } from "../../utils/aptos";

interface AmnisStakeFormProps {
  privateKey: string;
  address: string;
  onOperationComplete?: () => void;
}

export default function AmnisStakeForm({
  privateKey,
  address,
  onOperationComplete,
}: AmnisStakeFormProps) {
  const { pop, push } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: { amount: string }) {
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

    setIsSubmitting(true);

    // Build confirmation message
    const confirmMessage = `Stake ${amount} APT from ${formatAddress(address)}?`;

    // Confirm transaction
    const confirmed = await confirmAlert({
      title: "Confirm Stake",
      message: confirmMessage,
      primaryAction: {
        title: "Stake",
        style: Alert.ActionStyle.Default,
      },
    });

    if (!confirmed) {
      setIsSubmitting(false);
      return;
    }

    // Execute stake
    await showToast({ style: Toast.Style.Animated, title: "Staking..." });

    try {
      const hash = await stakeTokens(privateKey, amount);

      await showToast({
        style: Toast.Style.Success,
        title: "Staking Successful!",
        message: `Hash: ${hash.slice(0, 10)}...`,
      });

      // Show success screen
      push(
        <StakeSuccess
          amount={amount}
          address={address}
          hash={hash}
          onDone={() => {
            if (onOperationComplete) {
              onOperationComplete();
            }
            pop();
            pop();
          }}
        />,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await showToast({
        style: Toast.Style.Failure,
        title: "Staking Failed",
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
          <Action.SubmitForm title="Stake Tokens" icon={Icon.Star} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Stake Tokens on Amnis"
        text={`From: ${formatAddress(address)}`}
      />
      <Form.TextField
        id="amount"
        title="Amount (APT)"
        placeholder="1.0"
        info="Amount of APT to stake"
      />
    </Form>
  );
}

// Success screen component
function StakeSuccess({
  amount,
  address,
  hash,
  onDone,
}: {
  amount: number;
  address: string;
  hash: string;
  onDone: () => void;
}) {
  const explorerUrl = getExplorerUrl("txn", hash, "mainnet");

  return (
    <Detail
      markdown={`# Staking Successful!

**Network:** Mainnet

**Amount:** ${amount} APT

**Account:**
\`${address}\`

**Transaction Hash:**
\`${hash}\`

---

[View on Explorer](${explorerUrl})
`}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="View on Explorer" url={explorerUrl} />
          <Action.CopyToClipboard title="Copy Transaction Hash" content={hash} />
          <Action.CopyToClipboard title="Copy Account Address" content={address} />
          <Action title="Done" onAction={onDone} />
        </ActionPanel>
      }
    />
  );
}
