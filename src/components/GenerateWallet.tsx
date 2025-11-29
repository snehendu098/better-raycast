import { ActionPanel, Action, Detail, LocalStorage, useNavigation, showToast, Toast, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { Account } from "@aptos-labs/ts-sdk";

interface GenerateWalletProps {
  onComplete: (key: string) => void;
}

export default function GenerateWallet({ onComplete }: GenerateWalletProps) {
  const { pop } = useNavigation();
  const [newAccount, setNewAccount] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);

  useEffect(() => {
    // Generate a new account
    const account = Account.generate();
    setNewAccount({
      address: account.accountAddress.toString(),
      privateKey: account.privateKey.toString(),
    });
  }, []);

  if (!newAccount) {
    return <Detail isLoading={true} markdown="Generating wallet..." />;
  }

  return (
    <Detail
      markdown={`# 🆕 New Wallet Generated

**Address:**
\`${newAccount.address}\`

**Private Key:**
\`${newAccount.privateKey}\`

---

## ⚠️ Important!
1. **Save your private key** somewhere safe - you cannot recover it!
2. This is a **TESTNET** wallet
3. Get free testnet APT from the [Aptos Faucet](https://aptos.dev/network/faucet)

---

Click **"Use This Wallet"** to save it to your extension.
`}
      actions={
        <ActionPanel>
          <Action
            title="Use This Wallet"
            icon={Icon.Check}
            onAction={async () => {
              await LocalStorage.setItem("privateKey", newAccount.privateKey);
              await showToast({
                style: Toast.Style.Success,
                title: "Wallet saved!",
              });
              onComplete(newAccount.privateKey);
              pop();
            }}
          />
          <Action.CopyToClipboard
            title="Copy Private Key"
            content={newAccount.privateKey}
            shortcut={{ modifiers: ["cmd"], key: "k" }}
          />
          <Action.CopyToClipboard
            title="Copy Address"
            content={newAccount.address}
            shortcut={{ modifiers: ["cmd"], key: "a" }}
          />
          <Action.OpenInBrowser title="Get Testnet APT (Faucet)" url="https://aptos.dev/network/faucet" />
        </ActionPanel>
      }
    />
  );
}
