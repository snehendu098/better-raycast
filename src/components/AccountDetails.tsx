import { Detail, ActionPanel, Action, Icon } from "@raycast/api";
import { useCallback } from "react";
import {
  getBalance,
  getAccountInfo,
  getNameFromAddress,
  getStakingInfo,
  getExplorerUrl,
} from "../utils/aptos";
import { useFetch } from "../hooks";
import { NetworkType } from "../types";
import { BALANCE_DECIMALS } from "../constants";

interface AccountDetailsProps {
  address: string;
  network: NetworkType;
}

interface AccountData {
  balance: number;
  sequenceNumber: string | null;
  authenticationKey: string | null;
  ansName: string | null;
  stakedAmount: number | null;
  pendingRewards: number | null;
}

export default function AccountDetails({ address, network }: AccountDetailsProps) {
  const fetchAccountData = useCallback(async (): Promise<AccountData> => {
    const [balance, accountInfo, ansName, stakingInfo] = await Promise.all([
      getBalance(address, network),
      getAccountInfo(address, network),
      getNameFromAddress(address, network),
      getStakingInfo(address, network),
    ]);

    return {
      balance,
      sequenceNumber: accountInfo?.sequenceNumber ?? null,
      authenticationKey: accountInfo?.authenticationKey ?? null,
      ansName,
      stakedAmount: stakingInfo?.stakedAmount ?? null,
      pendingRewards: stakingInfo?.pendingRewards ?? null,
    };
  }, [address, network]);

  const { data, isLoading, refetch } = useFetch<AccountData>(fetchAccountData, {
    onError: "Failed to load account details",
    deps: [address, network],
  });

  const markdown = data
    ? `# Account Details

**Network:** ${network}

---

## Balance

**APT Balance:** ${data.balance.toFixed(BALANCE_DECIMALS)} APT

---

## Account Info

**Address:**
\`${address}\`

${data.ansName ? `**ANS Name:** ${data.ansName}` : "**ANS Name:** Not registered"}

${data.sequenceNumber !== null ? `**Sequence Number:** ${data.sequenceNumber}` : ""}

${data.authenticationKey ? `**Authentication Key:**\n\`${data.authenticationKey}\`` : ""}

---

## Staking

${data.stakedAmount !== null ? `**Staked Amount:** ${data.stakedAmount.toFixed(BALANCE_DECIMALS)} APT` : "**Staked Amount:** None"}

${data.pendingRewards !== null ? `**Pending Rewards:** ${data.pendingRewards.toFixed(BALANCE_DECIMALS)} APT` : ""}
`
    : "Loading account details...";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle="Account Details"
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Address" content={address} />
          <Action.OpenInBrowser title="View on Explorer" url={getExplorerUrl("account", address, network)} />
          <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={refetch} />
        </ActionPanel>
      }
    />
  );
}
