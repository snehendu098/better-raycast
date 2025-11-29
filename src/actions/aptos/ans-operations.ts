import { NetworkType } from "../../types";
import { getClient } from "../../utils/aptos";

// Get ANS name from address (e.g., "0x123..." -> "kent.apt")
export async function getNameFromAddress(address: string, network: NetworkType): Promise<string | null> {
  try {
    const client = getClient(network);
    const name = await client.fetchNameFromAddress({ address });
    return name?.toString() || null;
  } catch (error) {
    return null;
  }
}

// Get address from ANS name (e.g., "kent.apt" -> "0x123...")
export async function getAddressFromName(name: string, network: NetworkType): Promise<string | null> {
  try {
    const client = getClient(network);
    const address = await client.fetchAddressFromName({ name });
    return address?.toString() || null;
  } catch (error) {
    return null;
  }
}
