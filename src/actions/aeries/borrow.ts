import { getAccountFromPrivateKey, getClientWithAccount } from "../../utils/aptos";

/**
 * Borrow tokens from Aeries
 * @param privateKeyHex Private key in hex format
 * @param assetType MoveStructId of the token to borrow (e.g., "0x1::aptos_coin::AptosCoin")
 * @param amount Amount to borrow (in human readable format)
 * @param decimals Decimals of the asset being borrowed (default 8 for APT)
 * @param network Network to perform the operation on (default: mainnet for Aeries)
 * @returns Transaction hash
 * @throws Error if borrowing fails or parameters are invalid
 */
export async function borrowAriesToken(
  privateKeyHex: string,
  assetType: string,
  amount: number,
  decimals: number = 8,
  network: "mainnet" | "testnet" | "devnet" = "mainnet",
): Promise<string> {
  try {
    // Validate inputs
    if (!assetType) {
      throw new Error("Asset type must be provided");
    }

    if (amount <= 0) {
      throw new Error("Borrow amount must be greater than 0");
    }

    if (decimals < 0) {
      throw new Error("Decimals cannot be negative");
    }

    const account = getAccountFromPrivateKey(privateKeyHex);
    const client = getClientWithAccount(network, account);

    // Convert amount to smallest unit based on token decimals
    const amountInSmallestUnit = BigInt(Math.floor(amount * Math.pow(10, decimals)));

    const transaction = await client.buildTransaction({
      data: {
        function: "0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3::controller::withdraw",
        typeArguments: [assetType],
        functionArguments: [amountInSmallestUnit, true],
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
      console.error("Borrow transaction failed:", confirmedTransaction);
      throw new Error(`Borrow failed: ${confirmedTransaction.vm_status || "Unknown error"}`);
    }

    return transactionResponse.hash;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Borrow failed: ${message}`);
  }
}
