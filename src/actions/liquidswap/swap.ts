import { Network } from "@aptos-labs/ts-sdk";
import { getAccountFromPrivateKey, getClientWithAccount } from "../../utils/aptos";

/**
 * Swap tokens in Liquidswap
 * @param privateKeyHex Private key in hex format
 * @param mintX MoveStructId of the token to swap from
 * @param mintY MoveStructId of the token to swap to
 * @param swapAmount Amount of tokens to swap (in decimal/human readable format)
 * @param minCoinOut Minimum amount of tokens to receive (in decimals, default 0)
 * @param decimalsX Decimals of the source token (default 8 for APT)
 * @returns Transaction hash
 * @throws Error if swap amount is invalid or non-positive
 */
export async function swap(
  privateKeyHex: string,
  mintX: string,
  mintY: string,
  swapAmount: number,
  minCoinOut: number = 0,
  decimalsX: number = 8,
): Promise<string> {
  try {
    // Validate inputs
    if (!mintX || !mintY) {
      throw new Error("Both mintX and mintY must be provided");
    }

    if (mintX === mintY) {
      throw new Error("mintX and mintY must be different");
    }

    if (swapAmount <= 0) {
      throw new Error("Swap amount must be greater than 0");
    }

    if (minCoinOut < 0) {
      throw new Error("Minimum coin out cannot be negative");
    }

    const account = getAccountFromPrivateKey(privateKeyHex);
    const client = getClientWithAccount(Network.MAINNET, account);

    // Convert swap amount to smallest unit based on token decimals
    const amountInSmallestUnit = BigInt(Math.floor(swapAmount * Math.pow(10, decimalsX)));

    // Convert min coin out (assuming same decimals for destination)
    const minCoinOutInSmallestUnit = BigInt(Math.floor(minCoinOut * Math.pow(10, decimalsX)));

    const transaction = await client.buildTransaction({
      data: {
        function: "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap",
        typeArguments: [
          mintX,
          mintY,
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated",
        ],
        functionArguments: [amountInSmallestUnit, minCoinOutInSmallestUnit],
      },
      sender: account.accountAddress,
    });

    const transactionResponse = await client.signAndSubmitTransaction({
      transaction,
    });

    // Wait for transaction to be confirmed
    const confirmedTransaction = await client.waitForTransaction({ hash: transactionResponse.hash });

    // Check if transaction was successful
    if (!confirmedTransaction.success) {
      console.error("Transaction failed:", confirmedTransaction);
      throw new Error(`Transaction failed: ${confirmedTransaction.vm_status || "Unknown error"}`);
    }

    return transactionResponse.hash;
  } catch (error: any) {
    throw new Error(`Swap failed: ${error.message}`);
  }
}
