import { Form, ActionPanel, Action, Icon, showToast, Toast, Detail, useNavigation } from "@raycast/api";
import { useState } from "react";
import { getAddressFromName, getNameFromAddress } from "../../actions/aptos";
import { getExplorerUrl } from "../../utils/aptos";
import { NetworkType } from "../../types";

interface ANSLookupProps {
  network: NetworkType;
}

type LookupType = "name-to-address" | "address-to-name";

export default function ANSLookup({ network }: ANSLookupProps) {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [lookupType, setLookupType] = useState<LookupType>("name-to-address");

  async function handleSubmit(values: { input: string }) {
    if (!values.input || values.input.trim() === "") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Input",
        message: "Please enter a value to lookup",
      });
      return;
    }

    setIsLoading(true);

    try {
      let result: string | null = null;

      if (lookupType === "name-to-address") {
        result = await getAddressFromName(values.input.trim(), network);
      } else {
        result = await getNameFromAddress(values.input.trim(), network);
      }

      push(
        <ANSResult
          lookupType={lookupType}
          input={values.input.trim()}
          result={result}
          network={network}
        />
      );
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Lookup Failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="ANS Lookup"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Lookup" icon={Icon.MagnifyingGlass} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="lookupType"
        title="Lookup Type"
        value={lookupType}
        onChange={(value) => setLookupType(value as LookupType)}
      >
        <Form.Dropdown.Item value="name-to-address" title="Name → Address" />
        <Form.Dropdown.Item value="address-to-name" title="Address → Name" />
      </Form.Dropdown>
      <Form.TextField
        id="input"
        title={lookupType === "name-to-address" ? "ANS Name" : "Address"}
        placeholder={lookupType === "name-to-address" ? "example.apt" : "0x..."}
      />
      <Form.Description
        title="Network"
        text={network}
      />
    </Form>
  );
}

function ANSResult({
  lookupType,
  input,
  result,
  network,
}: {
  lookupType: LookupType;
  input: string;
  result: string | null;
  network: NetworkType;
}) {
  const isNameToAddress = lookupType === "name-to-address";
  const title = isNameToAddress ? "ANS Name Lookup" : "Address Lookup";

  const markdown = result
    ? `# ${title}

**Network:** ${network}

---

**${isNameToAddress ? "Name" : "Address"}:**
\`${input}\`

**${isNameToAddress ? "Address" : "Name"}:**
\`${result}\`
`
    : `# ${title}

**Network:** ${network}

---

**${isNameToAddress ? "Name" : "Address"}:**
\`${input}\`

**Result:** Not found
`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={title}
      actions={
        <ActionPanel>
          {result && (
            <>
              <Action.CopyToClipboard title="Copy Result" content={result} />
              {isNameToAddress && (
                <Action.OpenInBrowser
                  title="View on Explorer"
                  url={getExplorerUrl("account", result, network)}
                />
              )}
            </>
          )}
          <Action.CopyToClipboard title="Copy Input" content={input} />
        </ActionPanel>
      }
    />
  );
}
