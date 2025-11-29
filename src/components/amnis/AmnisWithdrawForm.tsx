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
import { unstakeTokens } from "../../actions/amnis/withdraw-stake";
import { formatAddress, getExplorerUrl } from "../../utils/aptos";

interface AmnisWithdrawFormProps {
  privateKey: string;
  address: string;
  onOperationComplete?: () => void;
}

export default function AmnisWithdrawForm({
  privateKey,
  address,
  onOperationComplete,
}: AmnisWithdrawFormProps) {
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
    const confirmMessage = `Withdraw ${amount} APT from ${formatAddress(address)}?`;

    // Confirm transaction
    const confirmed = await confirmAlert({
      title: "Confirm Withdrawal",
      message: confirmMessage,
      primaryAction: {
        title: "Withdraw",
        style: Alert.ActionStyle.Default,
      },
    });

    if (!confirmed) {
      setIsSubmitting(false);
      return;
    }

    // Execute unstake
    await showToast({ style: Toast.Style.Animated, title: "Withdrawing..." });

    try {
      const hash = await unstakeTokens(privateKey, amount);

      await showToast({
        style: Toast.Style.Success,
        title: "Withdrawal Successful!",
        message: `Hash: ${hash.slice(0, 10)}...`,
      });

      // Show success screen
      push(
        <WithdrawSuccess
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
        title: "Withdrawal Failed",
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
          <Action.SubmitForm title="Withdraw Tokens" icon={Icon.ArrowDown} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Withdraw Tokens from Amnis"
        text={`From: ${formatAddress(address)}`}
      />
      <Form.TextField
        id="amount"
        title="Amount (APT)"
        placeholder="1.0"
        info="Amount of APT to withdraw"
      />
    </Form>
  );
}

// Success screen component
function WithdrawSuccess({
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
      markdown={`# Withdrawal Successful!

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
