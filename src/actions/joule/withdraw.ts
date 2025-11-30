import { getAccountFromPrivateKey, getClientWithAccount } from "../../utils/aptos";

/**
 * Withdraw APT, tokens or fungible asset from a Joule position
 * @param privateKeyHex Private key in hex format
 * @param assetType MoveStructId of the token to withdraw (e.g., "0x1::aptos_coin::AptosCoin")
 * @param amount Amount to withdraw (in human readable format)
 * @param positionId The position ID to withdraw from
 * @param decimals Decimals of the asset being withdrawn (default 8 for APT)
 * @param fungibleAsset boolean value for fungible asset (default false for coin standard)
 * @param network Network to perform the operation on (default: mainnet)
 * @returns Transaction hash and position ID
 * @throws Error if withdrawal fails or parameters are invalid
 * @example
 * ```ts
 * const result = await withdrawToken(privateKeyHex, "0x1::aptos_coin::AptosCoin", amount, positionId, 8, false, "mainnet");
 * ```
 */
export async function withdrawToken(
  privateKeyHex: string,
  assetType: string,
  amount: number,
  positionId: string,
  decimals: number = 8,
  fungibleAsset: boolean = false,
  network: "mainnet" | "testnet" | "devnet" = "mainnet",
): Promise<{
  hash: string;
  positionId: string;
}> {
  try {
    // Validate inputs
    if (!assetType) {
      throw new Error("Asset type must be provided");
    }

    if (amount <= 0) {
      throw new Error("Withdraw amount must be greater than 0");
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
          ? "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::withdraw_fa"
          : "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::withdraw",
        typeArguments: fungibleAsset ? [] : [assetType],
        functionArguments: fungibleAsset
          ? [positionId, assetType, amountInSmallestUnit]
          : [positionId, amountInSmallestUnit],
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
      console.error("Withdraw transaction failed:", confirmedTransaction);
      throw new Error(`Withdraw failed: ${confirmedTransaction.vm_status || "Unknown error"}`);
    }

    return {
      hash: transactionResponse.hash,
      positionId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Token withdraw failed: ${message}`);
  }
}
