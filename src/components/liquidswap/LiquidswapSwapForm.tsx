import {
  ActionPanel,
  Action,
  Form,
  useNavigation,
  showToast,
  Toast,
  Detail,
  Icon,
  confirmAlert,
  Alert,
} from "@raycast/api";
import { useState } from "react";
import { swap } from "../../actions/liquidswap/swap";
import { formatAddress, getExplorerUrl } from "../../utils/aptos";
import {
  COMMON_TOKENS,
  findTokenBySymbol,
  getTokenDecimals,
  isValidMoveStructId,
  getTokenInfo,
} from "../../actions/liquidswap/tokens";

interface LiquidswapSwapFormProps {
  privateKey: string;
  address: string;
  onOperationComplete?: () => void;
}

export default function LiquidswapSwapForm({
  privateKey,
  address,
  onOperationComplete,
}: LiquidswapSwapFormProps) {
  const { pop, push } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minCoinOut, setMinCoinOut] = useState<number>(0);
  const [useCustomFrom, setUseCustomFrom] = useState(false);
  const [useCustomTo, setUseCustomTo] = useState(false);

  /**
   * Calculate minimum output based on slippage tolerance
   */
  function calculateMinOutput(amount: string, slippage: string) {
    // This is a placeholder - in real implementation, you'd fetch the expected output from the protocol
    // For now, we'll just apply slippage to a rough estimate
    const amountNum = parseFloat(amount) || 0;
    const slippageNum = parseFloat(slippage) || 0;

    // Rough calculation: assuming 1:1 for demo, apply slippage
    const roughOutput = amountNum * (1 - slippageNum / 100);
    setMinCoinOut(roughOutput);
  }

  async function handleSubmit(values: {
    tokenFrom: string;
    tokenTo: string;
    customFromAddress?: string;
    customToAddress?: string;
    amount: string;
    slippage: string;
  }) {
    const { tokenFrom, tokenTo, customFromAddress, customToAddress, amount, slippage } = values;

    // Determine source token and move struct ID
    let sourceMoveStructId: string;
    let sourceTokenSymbol: string;
    let sourceDecimals: number;

    if (useCustomFrom) {
      // Validate custom from address
      if (!customFromAddress || customFromAddress.trim().length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid Custom Token",
          message: "Please enter a custom token address",
        });
        return;
      }

      if (!isValidMoveStructId(customFromAddress)) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid Token Address",
          message: "Address must be in format: 0x...::module::TokenName",
        });
        return;
      }

      sourceMoveStructId = customFromAddress;
      const sourceInfo = getTokenInfo(customFromAddress);
      sourceTokenSymbol = sourceInfo.name;
      sourceDecimals = sourceInfo.decimals;
    } else {
      // Use preset token
      if (!tokenFrom) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid Token",
          message: "Please select a source token",
        });
        return;
      }

      const sourceToken = findTokenBySymbol(tokenFrom);
      if (!sourceToken) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Token Error",
          message: "Could not find source token information",
        });
        return;
      }

      sourceMoveStructId = sourceToken.moveStructId;
      sourceTokenSymbol = tokenFrom;
      sourceDecimals = sourceToken.decimals;
    }

    // Determine destination token and move struct ID
    let destMoveStructId: string;
    let destTokenSymbol: string;

    if (useCustomTo) {
      // Validate custom to address
      if (!customToAddress || customToAddress.trim().length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid Custom Token",
          message: "Please enter a custom token address",
        });
        return;
      }

      if (!isValidMoveStructId(customToAddress)) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid Token Address",
          message: "Address must be in format: 0x...::module::TokenName",
        });
        return;
      }

      destMoveStructId = customToAddress;
      const destInfo = getTokenInfo(customToAddress);
      destTokenSymbol = destInfo.name;
    } else {
      // Use preset token
      if (!tokenTo) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid Token",
          message: "Please select a destination token",
        });
        return;
      }

      const destToken = findTokenBySymbol(tokenTo);
      if (!destToken) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Token Error",
          message: "Could not find destination token information",
        });
        return;
      }

      destMoveStructId = destToken.moveStructId;
      destTokenSymbol = tokenTo;
    }

    // Validate tokens are different
    if (sourceMoveStructId === destMoveStructId) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Swap",
        message: "Source and destination tokens must be different",
      });
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Amount",
        message: "Please enter a valid positive number",
      });
      return;
    }

    // Validate slippage
    const slippageNum = parseFloat(slippage) || 0.5;
    if (slippageNum < 0 || slippageNum > 100) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Slippage",
        message: "Slippage must be between 0 and 100",
      });
      return;
    }

    setIsSubmitting(true);

    // Build confirmation message
    const confirmMessage = `Swap ${amountNum} ${sourceTokenSymbol} for at least ${minCoinOut.toFixed(6)} ${destTokenSymbol}?`;

    // Confirm transaction
    const confirmed = await confirmAlert({
      title: "Confirm Swap",
      message: confirmMessage,
      primaryAction: {
        title: "Swap",
        style: Alert.ActionStyle.Default,
      },
    });

    if (!confirmed) {
      setIsSubmitting(false);
      return;
    }

    // Execute swap
    await showToast({ style: Toast.Style.Animated, title: "Processing swap..." });

    try {
      const hash = await swap(
        privateKey,
        sourceMoveStructId,
        destMoveStructId,
        amountNum,
        minCoinOut,
        sourceDecimals,
      );

      await showToast({
        style: Toast.Style.Success,
        title: "Swap Successful!",
        message: `Hash: ${hash.slice(0, 10)}...`,
      });

      // Show success screen
      push(
        <SwapSuccess
          amount={amountNum}
          tokenFrom={sourceTokenSymbol}
          tokenTo={destTokenSymbol}
          minOutput={minCoinOut}
          hash={hash}
          onDone={() => {
            if (onOperationComplete) {
              onOperationComplete();
            }
            pop();
            pop();
          }}
        />,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await showToast({
        style: Toast.Style.Failure,
        title: "Swap Failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Swap Tokens" icon={Icon.ArrowRightCircle} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Swap Tokens on Liquidswap"
        text={`From: ${formatAddress(address)}`}
      />
      <Form.Dropdown
        id="tokenFrom"
        title="Swap From"
        info="Select a token or choose Custom to enter a move struct ID"
        onChange={(value) => {
          if (value === "CUSTOM") {
            setUseCustomFrom(true);
          } else {
            setUseCustomFrom(false);
          }
        }}
      >
        {COMMON_TOKENS.map((token) => (
          <Form.Dropdown.Item key={token.moveStructId} value={token.symbol} title={`${token.symbol} - ${token.name}`} />
        ))}
        <Form.Dropdown.Item value="CUSTOM" title="📝 Custom Token Address" />
      </Form.Dropdown>

      {useCustomFrom && (
        <Form.TextField
          id="customFromAddress"
          title="Custom From Address"
          placeholder="0x1::aptos_coin::AptosCoin"
          info="Enter the move struct ID (0x...::module::TokenName)"
        />
      )}

      <Form.Dropdown
        id="tokenTo"
        title="Swap To"
        info="Select a token or choose Custom to enter a move struct ID"
        onChange={(value) => {
          if (value === "CUSTOM") {
            setUseCustomTo(true);
          } else {
            setUseCustomTo(false);
          }
        }}
      >
        {COMMON_TOKENS.map((token) => (
          <Form.Dropdown.Item key={token.moveStructId} value={token.symbol} title={`${token.symbol} - ${token.name}`} />
        ))}
        <Form.Dropdown.Item value="CUSTOM" title="📝 Custom Token Address" />
      </Form.Dropdown>

      {useCustomTo && (
        <Form.TextField
          id="customToAddress"
          title="Custom To Address"
          placeholder="0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"
          info="Enter the move struct ID (0x...::module::TokenName)"
        />
      )}
      <Form.TextField
        id="amount"
        title="Amount"
        placeholder="0.1"
        info="Amount of tokens to swap"
      />
      <Form.TextField
        id="slippage"
        title="Slippage Tolerance (%)"
        placeholder="0.5"
        info="Maximum acceptable slippage percentage"
        onChange={(value) => {
          const formValues = new FormData();
          // Trigger min coin out calculation
          const amountField = document.querySelector('[data-id="amount"]') as HTMLInputElement;
          if (amountField) {
            calculateMinOutput(amountField.value, value);
          }
        }}
      />
    </Form>
  );
}

// Success screen component
function SwapSuccess({
  amount,
  tokenFrom,
  tokenTo,
  minOutput,
  hash,
  onDone,
}: {
  amount: number;
  tokenFrom: string;
  tokenTo: string;
  minOutput: number;
  hash: string;
  onDone: () => void;
}) {
  const explorerUrl = getExplorerUrl("txn", hash, "mainnet");

  return (
    <Detail
      markdown={`# Swap Successful!

**Network:** Mainnet

**Swapped:** ${amount} ${tokenFrom}

**Received (minimum):** ${minOutput.toFixed(6)} ${tokenTo}

**Transaction Hash:**
\`${hash}\`

---

[View on Explorer](${explorerUrl})
`}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="View on Explorer" url={explorerUrl} />
          <Action.CopyToClipboard title="Copy Transaction Hash" content={hash} />
          <Action title="Done" onAction={onDone} />
        </ActionPanel>
      }
    />
  );
}
