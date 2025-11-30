import { getAccountFromPrivateKey, getClientWithAccount } from "../../utils/aptos";

/**
 * Claim rewards from Joule pool
 * @param privateKeyHex Private key in hex format
 * @param rewardCoinType The coin type of the reward (e.g., "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt")
 * @param network Network to perform the operation on (default: mainnet)
 * @returns Transaction hash
 * @throws Error if claiming rewards fails or parameters are invalid
 * @example
 * ```ts
 * const transactionHash = await claimReward(privateKeyHex, "0x1::aptos_coin::AptosCoin", "mainnet");
 * ```
 */
export async function claimReward(
  privateKeyHex: string,
  rewardCoinType: string,
  network: "mainnet" | "testnet" | "devnet" = "mainnet",
): Promise<string> {
  try {
    // Validate inputs
    if (!rewardCoinType) {
      throw new Error("Reward coin type must be provided");
    }

    const account = getAccountFromPrivateKey(privateKeyHex);
    const client = getClientWithAccount(network, account);

    // Determine if the coin type is StakedApt (Amnis staking token)
    const isCoinTypeSTApt =
      rewardCoinType === "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt";

    // Build transaction with appropriate reward type
    const transaction = await client.buildTransaction({
      data: {
        function: "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::claim_rewards",
        typeArguments: [
          isCoinTypeSTApt
            ? "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt"
            : "0x1::aptos_coin::AptosCoin",
        ],
        functionArguments: [rewardCoinType, isCoinTypeSTApt ? "amAPTIncentives" : "APTIncentives"],
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
      console.error("Claim rewards transaction failed:", confirmedTransaction);
      throw new Error(`Claim rewards failed: ${confirmedTransaction.vm_status || "Unknown error"}`);
    }

    return transactionResponse.hash;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Claim rewards failed: ${message}`);
  }
}
