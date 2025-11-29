import { Network } from "@aptos-labs/ts-sdk";
import { getAccountFromPrivateKey, getClientWithAccount } from "../../utils/aptos";
import { OCTAS_PER_APT } from "../../constants";

export async function unstakeTokens(privateKeyHex: string, amount: number): Promise<string> {
  try {
    const account = getAccountFromPrivateKey(privateKeyHex);
    const client = getClientWithAccount(Network.MAINNET, account);

    const amountInOctas = BigInt(Math.floor(amount * OCTAS_PER_APT));

    const transaction = await client.buildTransaction({
      data: {
        function: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::router::unstake_entry",
        functionArguments: [amountInOctas, account.accountAddress.toString()],
      },
      sender: account.accountAddress,
    });

    const transactionResponse = await client.signAndSubmitTransaction({
      transaction,
    });

    // Wait for transaction confirmation
    const confirmedTransaction = await client.waitForTransaction({
      hash: transactionResponse.hash,
    });

    // Validate transaction success
    if (!confirmedTransaction.success) {
      throw new Error(`Transaction failed: ${confirmedTransaction.vm_status}`);
    }

    return transactionResponse.hash;
  } catch (error: any) {
    throw new Error(`Token unstaking failed: ${error.message}`);
  }
}
