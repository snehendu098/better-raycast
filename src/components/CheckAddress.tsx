import { Form, ActionPanel, Action, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { accountExists } from "../utils/aptos";
import { NetworkType } from "../types";
import { MIN_ADDRESS_LENGTH, ADDRESS_PREFIX } from "../constants";
import AccountDetails from "./AccountDetails";

interface CheckAddressProps {
  network: NetworkType;
}

export default function CheckAddress({ network }: CheckAddressProps) {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: { address: string }) {
    if (!values.address || values.address.trim() === "") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Address",
        message: "Please enter an address to check",
      });
      return;
    }

    const address = values.address.trim();

    if (!address.startsWith(ADDRESS_PREFIX) || address.length < MIN_ADDRESS_LENGTH) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Address",
        message: "Please enter a valid Aptos address (0x...)",
      });
      return;
    }

    setIsLoading(true);

    try {
      const exists = await accountExists(address, network);

      if (!exists) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Account Not Found",
          message: "This address does not exist on chain",
        });
        setIsLoading(false);
        return;
      }

      push(<AccountDetails address={address} network={network} />);
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
      navigationTitle="Check Address"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Check Address" icon={Icon.MagnifyingGlass} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="address"
        title="Address"
        placeholder="0x..."
        info="Enter any Aptos address to view its details"
      />
      <Form.Description title="Network" text={network} />
    </Form>
  );
}
