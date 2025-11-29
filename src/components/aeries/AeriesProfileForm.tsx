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
import { createAriesProfile } from "../../actions/aeries/create-profile";
import { formatAddress, getExplorerUrl } from "../../utils/aptos";

interface AeriesProfileFormProps {
  privateKey: string;
  address: string;
  onOperationComplete?: () => void;
}

export default function AeriesProfileForm({
  privateKey,
  address,
  onOperationComplete,
}: AeriesProfileFormProps) {
  const { pop, push } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);

    // Build confirmation message
    const confirmMessage = `Create an Aeries profile for ${formatAddress(address)}?`;

    // Confirm transaction
    const confirmed = await confirmAlert({
      title: "Confirm Profile Creation",
      message: confirmMessage,
      primaryAction: {
        title: "Create",
        style: Alert.ActionStyle.Default,
      },
    });

    if (!confirmed) {
      setIsSubmitting(false);
      return;
    }

    // Execute profile creation
    await showToast({ style: Toast.Style.Animated, title: "Creating profile..." });

    try {
      const hash = await createAriesProfile(privateKey, "mainnet");

      await showToast({
        style: Toast.Style.Success,
        title: "Profile Created!",
        message: `Hash: ${hash.slice(0, 10)}...`,
      });

      // Show success screen
      push(
        <ProfileSuccess
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
        title: "Profile Creation Failed",
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
          <Action
            title="Create Profile"
            icon={Icon.UserGroup}
            onAction={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Create Aeries Profile"
        text={`Account: ${formatAddress(address)}\n\nThis will enable you to lend, borrow, and perform other operations on Aeries.`}
      />
    </Form>
  );
}

// Success screen component
function ProfileSuccess({
  address,
  hash,
  onDone,
}: {
  address: string;
  hash: string;
  onDone: () => void;
}) {
  const explorerUrl = getExplorerUrl("txn", hash, "mainnet");

  return (
    <Detail
      markdown={`# Profile Created!

**Network:** Mainnet

**Account:**
\`${address}\`

**Transaction Hash:**
\`${hash}\`

---

Your Aeries profile has been successfully created. You can now lend, borrow, and perform other operations.

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
