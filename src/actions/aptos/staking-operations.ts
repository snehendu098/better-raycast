import { StakingInfo, NetworkType } from "../../types";
import { OCTAS_PER_APT } from "../../constants";
import { getClient } from "../../utils/aptos";

// Get staking info for an account
export async function getStakingInfo(address: string, network: NetworkType): Promise<StakingInfo | null> {
  try {
    const client = getClient(network);
    const { aptos } = client.getClients();
    const resources = await aptos.getAccountResources({
      accountAddress: address,
    });

    const stakePool = resources.find((r: any) => r.type === "0x1::stake::StakePool");

    if (!stakePool) return null;

    return {
      stakedAmount: Number((stakePool.data as any)?.active?.value || 0) / OCTAS_PER_APT,
      pendingRewards: 0,
    };
  } catch (error) {
    return null;
  }
}
