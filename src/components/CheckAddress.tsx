import { Form, ActionPanel, Action, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { accountExists, getAddressFromName } from "../utils/aptos";
import { NetworkType } from "../types";
import { MIN_ADDRESS_LENGTH, ADDRESS_PREFIX } from "../constants";
import AccountDetails from "./AccountDetails";

interface CheckAddressProps {
  network: NetworkType;
}

function isAnsName(input: string): boolean {
  return input.endsWith(".apt") || (!input.startsWith("0x") && !input.includes("0x"));
}

export default function CheckAddress({ network }: CheckAddressProps) {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: { address: string }) {
    if (!values.address || values.address.trim() === "") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Input",
        message: "Please enter an address or ANS name",
      });
      return;
    }

    const input = values.address.trim();
    setIsLoading(true);

    try {
      let address: string;

      // Check if input is an ANS name
      if (isAnsName(input)) {
        const resolvedAddress = await getAddressFromName(input, network);

        if (!resolvedAddress) {
          await showToast({
            style: Toast.Style.Failure,
            title: "ANS Name Not Found",
            message: `Could not resolve "${input}" to an address`,
          });
          setIsLoading(false);
          return;
        }

        address = resolvedAddress;
        await showToast({
          style: Toast.Style.Success,
          title: "ANS Name Resolved",
          message: `${input} → ${address.slice(0, 10)}...`,
        });
      } else {
        // Validate address format
        if (!input.startsWith(ADDRESS_PREFIX) || input.length < MIN_ADDRESS_LENGTH) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Invalid Address",
            message: "Please enter a valid Aptos address (0x...) or ANS name",
          });
          setIsLoading(false);
          return;
        }
        address = input;
      }

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
        title="Address or ANS Name"
        placeholder="0x... or name.apt"
        info="Enter an Aptos address or ANS name (e.g., kent.apt) to view its details"
      />
      <Form.Description title="Network" text={network} />
    </Form>
  );
}
