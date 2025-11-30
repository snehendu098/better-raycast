import { getAccountFromPrivateKey, getClientWithAccount } from "../../utils/aptos";

/**
 * Lend APT, tokens or fungible asset to a Joule position
 * @param privateKeyHex Private key in hex format
 * @param assetType MoveStructId of the token to lend (e.g., "0x1::aptos_coin::AptosCoin")
 * @param amount Amount to lend (in human readable format)
 * @param positionId The position ID to lend to
 * @param decimals Decimals of the asset being lent (default 8 for APT)
 * @param newPosition Whether to create a new position or not
 * @param fungibleAsset boolean value for fungible asset (default false for coin standard)
 * @param network Network to perform the operation on (default: mainnet)
 * @returns Transaction hash and position ID
 * @throws Error if lending fails or parameters are invalid
 * @example
 * ```ts
 * const result = await lendToken(privateKeyHex, "0x1::aptos_coin::AptosCoin", amount, positionId, 8, false, false, "mainnet");
 * ```
 */
export async function lendToken(
  privateKeyHex: string,
  assetType: string,
  amount: number,
  positionId: string,
  decimals: number = 8,
  newPosition: boolean = false,
  fungibleAsset: boolean = false,
  network: "mainnet" | "testnet" | "devnet" = "mainnet",
): Promise<{ hash: string; positionId: string }> {
  try {
    // Validate inputs
    if (!assetType) {
      throw new Error("Asset type must be provided");
    }

    if (amount <= 0) {
      throw new Error("Lend amount must be greater than 0");
    }

    if (!positionId) {
      throw new Error("Position ID must be provided");
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
        function: fungibleAsset
          ? "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::lend_fa"
          : "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::lend",
        typeArguments: fungibleAsset ? [] : [assetType],
        functionArguments: fungibleAsset
          ? [positionId, assetType, newPosition, amountInSmallestUnit]
          : [positionId, amountInSmallestUnit, newPosition],
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
      console.error("Lend transaction failed:", confirmedTransaction);
      throw new Error(`Lend failed: ${confirmedTransaction.vm_status || "Unknown error"}`);
    }

    return {
      hash: transactionResponse.hash,
      positionId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Token lend failed: ${message}`);
  }
}
