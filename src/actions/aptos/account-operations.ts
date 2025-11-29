import { AccountInfo, NetworkType } from "../../types";
import { getClient } from "../../utils/aptos";

// Get account info (sequence number, auth key)
export async function getAccountInfo(address: string, network: NetworkType): Promise<AccountInfo | null> {
  try {
    const client = getClient(network);
    const { aptos } = client.getClients();
    const info = await aptos.getAccountInfo({ accountAddress: address });

    return {
      sequenceNumber: info.sequence_number,
      authenticationKey: info.authentication_key,
    };
  } catch (error) {
    return null;
  }
}

// Check if an account exists on chain
export async function accountExists(address: string, network: NetworkType): Promise<boolean> {
  try {
    const client = getClient(network);
    const { aptos } = client.getClients();
    await aptos.getAccountInfo({ accountAddress: address });
    return true;
  } catch (error) {
    return false;
  }
}
