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
import { withdrawToken } from "../../actions/joule/withdraw";
import { formatAddress, getExplorerUrl } from "../../utils/aptos";

interface JouleWithdrawFormProps {
  privateKey: string;
  address: string;
  onOperationComplete?: () => void;
}

export default function JouleWithdrawForm({
  privateKey,
  address,
  onOperationComplete,
}: JouleWithdrawFormProps) {
  const { pop, push } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: {
    assetType: string;
    amount: string;
    decimals: string;
    positionId: string;
  }) {
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

    if (!values.positionId || !values.positionId.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Position ID",
        message: "Please enter a valid position ID",
      });
      return;
    }

    setIsSubmitting(true);

    // Build confirmation message
    const confirmMessage = `Withdraw ${amount} tokens from position ${values.positionId.slice(0, 10)}... to ${formatAddress(
      address,
    )}?`;

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
      const result = await withdrawToken(
        privateKey,
        values.assetType,
        amount,
        values.positionId,
        decimals,
        false,
        "mainnet",
      );

      await showToast({
        style: Toast.Style.Success,
        title: "Withdrawal Successful!",
        message: `Hash: ${result.hash.slice(0, 10)}...`,
      });

      // Show success screen
      push(
        <WithdrawSuccess
          amount={amount}
          address={address}
          hash={result.hash}
          assetType={values.assetType}
          positionId={result.positionId}
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
        title="Withdraw from Joule Position"
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
      <Form.TextField
        id="positionId"
        title="Position ID"
        placeholder="position-id"
        info="The position ID to withdraw from"
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
  positionId,
  onDone,
}: {
  amount: number;
  address: string;
  hash: string;
  assetType: string;
  positionId: string;
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

**Position ID:** ${positionId}

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
