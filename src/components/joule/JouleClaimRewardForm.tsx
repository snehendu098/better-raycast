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
import { claimReward } from "../../actions/joule/claim-reward";
import { formatAddress, getExplorerUrl } from "../../utils/aptos";

interface JouleClaimRewardFormProps {
  privateKey: string;
  address: string;
  onOperationComplete?: () => void;
}

export default function JouleClaimRewardForm({
  privateKey,
  address,
  onOperationComplete,
}: JouleClaimRewardFormProps) {
  const { pop, push } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: { rewardCoinType: string }) {
    // Validate inputs
    if (!values.rewardCoinType || !values.rewardCoinType.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Reward Coin Type",
        message: "Please enter a valid reward coin type (MoveStructId)",
      });
      return;
    }

    setIsSubmitting(true);

    // Build confirmation message
    const confirmMessage = `Claim rewards (${values.rewardCoinType.slice(0, 20)}...) to ${formatAddress(address)}?`;

    // Confirm transaction
    const confirmed = await confirmAlert({
      title: "Confirm Claim Rewards",
      message: confirmMessage,
      primaryAction: {
        title: "Claim",
        style: Alert.ActionStyle.Default,
      },
    });

    if (!confirmed) {
      setIsSubmitting(false);
      return;
    }

    // Execute claim reward
    await showToast({ style: Toast.Style.Animated, title: "Claiming rewards..." });

    try {
      const hash = await claimReward(privateKey, values.rewardCoinType, "mainnet");

      await showToast({
        style: Toast.Style.Success,
        title: "Claim Rewards Successful!",
        message: `Hash: ${hash.slice(0, 10)}...`,
      });

      // Show success screen
      push(
        <ClaimRewardSuccess
          address={address}
          hash={hash}
          rewardCoinType={values.rewardCoinType}
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
        title: "Claim Rewards Failed",
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
          <Action.SubmitForm title="Claim Rewards" icon={Icon.Gift} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Claim Joule Rewards"
        text={`To: ${formatAddress(address)}`}
      />
      <Form.TextField
        id="rewardCoinType"
        title="Reward Coin Type (MoveStructId)"
        placeholder="0x1::aptos_coin::AptosCoin"
        info="Full MoveStructId of the reward coin type"
      />
      <Form.Description
        title="Common Reward Types"
        text={`APT: 0x1::aptos_coin::AptosCoin\nStaked APT: 0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt`}
      />
    </Form>
  );
}

// Success screen component
function ClaimRewardSuccess({
  address,
  hash,
  rewardCoinType,
  onDone,
}: {
  address: string;
  hash: string;
  rewardCoinType: string;
  onDone: () => void;
}) {
  const explorerUrl = getExplorerUrl("txn", hash, "mainnet");

  return (
    <Detail
      markdown={`# Claim Rewards Successful!

**Network:** Mainnet

**Reward Coin Type:**
\`${rewardCoinType}\`

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
