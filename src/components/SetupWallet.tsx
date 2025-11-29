import { Form, useNavigation, showToast, Toast, LocalStorage, ActionPanel, Action } from "@raycast/api";

export default function SetupWallet({ onComplete }: { onComplete: (key: string) => void }) {
  const { pop } = useNavigation();

  async function handleSubmit(values: { privateKey: string }) {
    // Basic validation
    if (!values.privateKey || values.privateKey.length < 10) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Private Key",
        message: "Please enter a valid private key",
      });
      return;
    }

    // Save to LocalStorage
    await LocalStorage.setItem("privateKey", values.privateKey);

    await showToast({
      style: Toast.Style.Success,
      title: "Wallet Connected!",
    });

    // Notify parent and go back
    onComplete(values.privateKey);
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Wallet" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Setup Your Wallet"
        text="Enter your Aptos private key. It will be stored securely in Raycast's encrypted storage."
      />
      <Form.PasswordField id="privateKey" title="Private Key" placeholder="Enter your Aptos private key" />
      <Form.Description
        title="⚠️ Security Note"
        text="Your private key never leaves your device. It's stored encrypted by Raycast."
      />
    </Form>
  );
}
