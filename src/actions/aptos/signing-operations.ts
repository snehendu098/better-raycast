import { SignatureResult } from "../../types";
import { getAccountFromPrivateKey } from "../../utils/aptos";

// Sign an arbitrary message
export function signMessage(privateKeyHex: string, message: string): SignatureResult {
  const account = getAccountFromPrivateKey(privateKeyHex);
  const messageBytes = new TextEncoder().encode(message);
  const signature = account.sign(messageBytes);

  return {
    signature: signature.toString(),
    address: account.accountAddress.toString(),
    publicKey: account.publicKey.toString(),
  };
}
