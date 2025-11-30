import { getAccountFromPrivateKey, getClientWithAccount } from "../../utils/aptos";

/**
 * Repay APT, tokens or fungible asset to a Joule position
 * @param privateKeyHex Private key in hex format
 * @param assetType MoveStructId of the token to repay (e.g., "0x1::aptos_coin::AptosCoin")
 * @param amount Amount to repay (in human readable format)
 * @param positionId The position ID to repay to
 * @param decimals Decimals of the asset being repaid (default 8 for APT)
 * @param fungibleAsset boolean value for fungible asset (default false for coin standard)
 * @param network Network to perform the operation on (default: mainnet)
 * @returns Transaction hash and position ID
 * @throws Error if repayment fails or parameters are invalid
 * @example
 * ```ts
 * const result = await repayToken(privateKeyHex, "0x1::aptos_coin::AptosCoin", amount, positionId, 8, false, "mainnet");
 * ```
 */
export async function repayToken(
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
      throw new Error("Repay amount must be greater than 0");
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
          ? "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::repay_fa"
          : "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::repay",
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
      console.error("Repay transaction failed:", confirmedTransaction);
      throw new Error(`Repay failed: ${confirmedTransaction.vm_status || "Unknown error"}`);
    }

    return {
      hash: transactionResponse.hash,
      positionId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Token repay failed: ${message}`);
  }
}
