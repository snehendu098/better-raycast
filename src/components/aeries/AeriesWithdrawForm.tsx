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
import { withdrawAriesToken } from "../../actions/aeries/withdraw";
import { formatAddress, getExplorerUrl } from "../../utils/aptos";

interface AeriesWithdrawFormProps {
  privateKey: string;
  address: string;
  onOperationComplete?: () => void;
}

export default function AeriesWithdrawForm({
  privateKey,
  address,
  onOperationComplete,
}: AeriesWithdrawFormProps) {
  const { pop, push } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: { assetType: string; amount: string; decimals: string }) {
    // Validate inputs
    if (!values.assetType || !values.assetType.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Asset",
        message: "Please enter a valid asset type (MoveStructId)",
      });
      return;
    }

    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount <= 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Amount",
        message: "Please enter a valid positive number",
      });
      return;
    }

    const decimals = parseInt(values.decimals);
    if (isNaN(decimals) || decimals < 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Decimals",
        message: "Please enter a valid non-negative number",
      });
      return;
    }

    setIsSubmitting(true);

    // Build confirmation message
    const confirmMessage = `Withdraw ${amount} tokens (${values.assetType.slice(0, 20)}...) to ${formatAddress(address)}?`;

    // Confirm transaction
    const confirmed = await confirmAlert({
      title: "Confirm Withdraw",
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

    // Execute withdraw
    await showToast({ style: Toast.Style.Animated, title: "Withdrawing..." });

    try {
      const hash = await withdrawAriesToken(privateKey, values.assetType, amount, decimals, "mainnet");

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
          assetType={values.assetType}
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
          <Action.SubmitForm title="Withdraw Tokens" icon={Icon.Download} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Withdraw Supplied Tokens from Aeries"
        text={`To: ${formatAddress(address)}`}
      />
      <Form.TextField
        id="assetType"
        title="Asset Type (MoveStructId)"
        placeholder="0x1::aptos_coin::AptosCoin"
        info="Full MoveStructId of the token to withdraw"
      />
      <Form.TextField
        id="amount"
        title="Amount"
        placeholder="1.0"
        info="Amount of tokens to withdraw"
      />
      <Form.TextField
        id="decimals"
        title="Decimals"
        placeholder="8"
        info="Token decimals (default 8 for APT)"
      />
    </Form>
  );
}

// Success screen component
function WithdrawSuccess({
  amount,
  address,
  hash,
  assetType,
  onDone,
}: {
  amount: number;
  address: string;
  hash: string;
  assetType: string;
  onDone: () => void;
}) {
  const explorerUrl = getExplorerUrl("txn", hash, "mainnet");

  return (
    <Detail
      markdown={`# Withdrawal Successful!

**Network:** Mainnet

**Amount:** ${amount} tokens

**Asset Type:**
\`${assetType}\`

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
