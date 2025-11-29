import { Form, ActionPanel, Action, Icon, showToast, Toast, Detail, useNavigation } from "@raycast/api";
import { useState } from "react";
import { signMessage } from "../utils/aptos";

interface SignMessageProps {
  privateKey: string;
}

export default function SignMessage({ privateKey }: SignMessageProps) {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: { message: string }) {
    if (!values.message || values.message.trim() === "") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Message",
        message: "Please enter a message to sign",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = signMessage(privateKey, values.message.trim());

      push(
        <SignatureResult
          message={values.message.trim()}
          signature={result.signature}
          address={result.address}
          publicKey={result.publicKey}
        />,
      );
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Signing Failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Sign Message"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Sign Message" icon={Icon.Pencil} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="message"
        title="Message"
        placeholder="Enter message to sign..."
        info="The message will be signed with your private key"
      />
    </Form>
  );
}

function SignatureResult({
  message,
  signature,
  address,
  publicKey,
}: {
  message: string;
  signature: string;
  address: string;
  publicKey: string;
}) {
  const markdown = `# Signature Result

**Account Address:**
\`\`\`
${address}
\`\`\`

---

**Message:**
\`\`\`
${message}
\`\`\`

---

**Signature:**
\`\`\`
${signature}
\`\`\`

---

**Public Key:**
\`\`\`
${publicKey}
\`\`\`
`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle="Signature Result"
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Address" content={address} />
          <Action.CopyToClipboard title="Copy Signature" content={signature} />
          <Action.CopyToClipboard title="Copy Public Key" content={publicKey} />
          <Action.CopyToClipboard title="Copy Message" content={message} />
        </ActionPanel>
      }
    />
  );
}
