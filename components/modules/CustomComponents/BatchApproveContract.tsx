import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, useChainId, useReadContract } from "wagmi";
import { parseUnits, isAddress } from "viem";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import TokenSelect from "./TokenSelect";
import { TOKENS, getTokensForChain } from "@/contracts/tokens";
import SafeBatchApproveAbi from "@/contracts/SafeBatchApproveAbi.json";
import SafeBatchApproveV2Abi from "@/contracts/SafeBatchApproveV2Abi.json";

// SafeBatchApprove contract addresses by chain ID
const SAFE_BATCH_APPROVE_ADDRESSES = {
  1: "0xFEc57883108BBa6060AA2a61451Ce907BA14989c", // Mainnet
  11155111: "0xdc2C86ba70ae7Ded93b26AD16C12DDD179c3C279", // Sepolia V1
  56: "0xFEc57883108BBa6060AA2a61451Ce907BA14989c", // BSC (you can deploy here later)
};

// SafeBatchApproveV2 contract addresses (improved version)
const SAFE_BATCH_APPROVE_V2_ADDRESSES = {
  1: "0xFEc57883108BBa6060AA2a61451Ce907BA14989c", // Mainnet (deploy later)
  11155111: "0x4526473E72152ea4560b1A0c0a509d2e278ad312", // Sepolia V2
  56: "0xFEc57883108BBa6060AA2a61451Ce907BA14989c", // BSC (deploy later)
};

function SafeBatchApproveDemo() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();

  // Get contract address for current chain
  const getContractAddress = () => {
    return SAFE_BATCH_APPROVE_V2_ADDRESSES[chainId as keyof typeof SAFE_BATCH_APPROVE_V2_ADDRESSES] || 
           SAFE_BATCH_APPROVE_V2_ADDRESSES[11155111]; // Fallback to sepolia for testing
  };

  const getContractAbi = () => {
    return SafeBatchApproveV2Abi; // Use V2 ABI with events
  };

  const [selectedTokens, setSelectedTokens] = useState<any[]>([]);
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkingAllowance, setCheckingAllowance] = useState(false);
  const [allowanceResults, setAllowanceResults] = useState<{ [key: string]: string }>({});

  const tokens = getTokensForChain(chainId).filter((token) => !token.isNative);
  const handleTokenChange = (tokens: any[]) => setSelectedTokens(tokens);

  // Get explorer URL based on chain
  const getExplorerUrl = (txHash: string) => {
    switch (chainId) {
      case 1: // Mainnet
        return `https://etherscan.io/tx/${txHash}`;
      case 11155111: // Sepolia
        return `https://sepolia.etherscan.io/tx/${txHash}`;
      case 56: // BSC
        return `https://bscscan.com/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`;
    }
  };

  // Function to check allowances
  async function checkAllowances() {
    if (!address || !spender || !selectedTokens.length) return;
    
    setCheckingAllowance(true);
    setAllowanceResults({});
    
    try {
      const results: { [key: string]: string } = {};
      
      for (const token of selectedTokens) {
        try {
          // Simple contract call to get allowance
          const response = await fetch(`https://sepolia.etherscan.io/api?module=proxy&action=eth_call&to=${token.address}&data=0xdd62ed3e${address.slice(2).padStart(64, '0')}${spender.slice(2).padStart(64, '0')}&tag=latest&apikey=YourApiKeyToken`);
          const data = await response.json();
          
          if (data.result) {
            const allowanceValue = BigInt(data.result);
            const formattedAllowance = allowanceValue.toString();
            results[token.address] = formattedAllowance;
          } else {
            results[token.address] = "Error";
          }
        } catch (err) {
          results[token.address] = "Error";
        }
      }
      
      setAllowanceResults(results);
    } catch (err) {
      console.error("Error checking allowances:", err);
    } finally {
      setCheckingAllowance(false);
    }
  }

  async function handleBatchApprove() {
    try {
      if (!address) throw new Error("Wallet not connected");
      if (!spender) throw new Error("Spender address required");
      if (!amount) throw new Error("Amount required");
      if (!selectedTokens.length) throw new Error("Select at least one token");

      // Validate spender address
      if (!isAddress(spender)) {
        throw new Error("Invalid spender address format");
      }

      setStatus("Preparing batch approve...");
      setTxHash("");

      // Prepare token addresses array
      const tokenAddresses = selectedTokens.map((token) => token.address);
      
      // Validate all token addresses
      for (const tokenAddr of tokenAddresses) {
        if (!isAddress(tokenAddr)) {
          throw new Error(`Invalid token address: ${tokenAddr}`);
        }
      }

      // Use the first token's decimals for amount parsing (or you can use 18 as default)
      const decimals = selectedTokens[0]?.decimals ?? 18;
      const parsedAmount = parseUnits(amount, decimals);

      // Debug logging
      console.log("Debug info:", {
        contractAddress: getContractAddress(),
        tokenAddresses,
        spender,
        amount,
        parsedAmount: parsedAmount.toString(),
        decimals,
        chainId
      });

      setStatus("Sending batch approve transaction...");
      const tx = await writeContractAsync({
        address: getContractAddress() as `0x${string}`,
        abi: getContractAbi(),
        functionName: "batchApproveSimple", // Using simple version first
        args: [tokenAddresses, spender, parsedAmount],
      });
      setStatus("✅ Transaction sent successfully");
      setTxHash(tx);
    } catch (err: any) {
      console.error("Batch approve error:", err);
      
      // More detailed error message
      let errorMessage = "Unknown error";
      if (err.message) {
        errorMessage = err.message;
      }
      if (err.cause?.message) {
        errorMessage += ` (${err.cause.message})`;
      }
      if (err.details) {
        errorMessage += ` Details: ${err.details}`;
      }
      
      setStatus("❌ Error: " + errorMessage);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Token Selection Section */}
      <div className="space-y-3">
        <Label className="text-sm sm:text-base font-medium">Select Tokens</Label>
        <TokenSelect tokens={tokens} onChange={handleTokenChange} />
        {selectedTokens.length > 0 && (
          <div className="text-xs sm:text-sm text-gray-500">
            {selectedTokens.length} token(s) selected
          </div>
        )}
      </div>
      {/* Input Fields Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spenderAddress" className="text-sm font-medium">
            Spender Address
          </Label>
          <Input
            id="spenderAddress"
            placeholder="0x..."
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
            className="text-sm w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            Amount per Token
          </Label>
          <Input
            id="amount"
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm w-full"
          />
        </div>
      </div>
      {/* Action Button */}
      {selectedTokens.length > 0 && spender && amount && (
        <div className="space-y-3">
          <Button
            onClick={handleBatchApprove}
            disabled={checking || !isConnected}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Batch Approve (Contract)
          </Button>
          
          {/* Check Allowance Button */}
          <Button
            onClick={checkAllowances}
            disabled={checkingAllowance || !isConnected || !address}
            variant="secondary"
            className="w-full"
            size="sm"
          >
            {checkingAllowance ? "Checking..." : "Check Allowances"}
          </Button>
        </div>
      )}
      
      {/* Allowance Results */}
      {Object.keys(allowanceResults).length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 space-y-2">
          <h4 className="text-sm font-medium text-blue-900">Current Allowances</h4>
          <div className="text-xs text-blue-700 space-y-1">
            {selectedTokens.map((token) => (
              <div key={token.address} className="flex justify-between">
                <span>{token.symbol}:</span>
                <span className="font-mono">
                  {allowanceResults[token.address] || "Not checked"}
                  {allowanceResults[token.address] && allowanceResults[token.address] !== "Error" && 
                    ` (${(Number(allowanceResults[token.address]) / Math.pow(10, token.decimals)).toFixed(6)})`
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Summary Section */}
      {selectedTokens.length > 0 && amount && spender && (
        <div className="bg-green-50 rounded-lg p-3 sm:p-4 space-y-2">
          <h4 className="text-sm font-medium text-green-900">Transaction Summary</h4>
          <div className="text-xs text-green-700 space-y-1">
            <div>• Approving {selectedTokens.length} token(s)</div>
            <div>• Amount: {amount} per token</div>
            <div className="break-all">• Spender: {spender.slice(0, 8)}...{spender.slice(-6)}</div>
            <div className="break-all">• Contract: {getContractAddress().slice(0, 8)}...{getContractAddress().slice(-6)}</div>
          </div>
        </div>
      )}
      {status && <p className="mt-2 text-sm">{status}</p>}
      {txHash && (
        <p>
          Tx: <a href={getExplorerUrl(txHash)} target="_blank" rel="noreferrer">{txHash}</a>
        </p>
      )}
    </div>
  );
}

export default function BatchApproveContract() {
  return <SafeBatchApproveDemo />;
}
