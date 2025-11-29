import { getAccountFromPrivateKey, getClientWithAccount } from "../../utils/aptos";

/**
 * Create a profile in Aeries
 * @param privateKeyHex Private key in hex format
 * @param network Network to perform the operation on (default: mainnet for Aeries)
 * @returns Transaction hash
 * @throws Error if profile creation fails
 */
export async function createAriesProfile(
  privateKeyHex: string,
  network: "mainnet" | "testnet" | "devnet" = "mainnet",
): Promise<string> {
  try {
    const account = getAccountFromPrivateKey(privateKeyHex);
    const client = getClientWithAccount(network, account);

    const transaction = await client.buildTransaction({
      data: {
        function: "0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3::controller::register_user",
        functionArguments: ["Main Account"],
      },
      sender: account.accountAddress,
    });

    const transactionResponse = await client.signAndSubmitTransaction({
      transaction,
    });

    // Wait for transaction to be confirmed
    const confirmedTransaction = await client.waitForTransaction({
      hash: transactionResponse.hash,
    });

    // Check if transaction was successful
    if (!confirmedTransaction.success) {
      console.error("Create profile transaction failed:", confirmedTransaction);
      throw new Error(`Create profile failed: ${confirmedTransaction.vm_status || "Unknown error"}`);
    }

    return transactionResponse.hash;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Create profile failed: ${message}`);
  }
}
