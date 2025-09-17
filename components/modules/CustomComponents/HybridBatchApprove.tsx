import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useChainId } from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TokenSelect from "./TokenSelect";
import { getTokensForChain } from "@/contracts/tokens";

const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

// Standard ERC20 ABI for approve function
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  }
];

function HybridBatchApprove() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();

  const [selectedTokens, setSelectedTokens] = useState<any[]>([]);
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [currentStep, setCurrentStep] = useState<"setup" | "batch">("setup");
  const [tokenApprovals, setTokenApprovals] = useState<{[key: string]: boolean}>({});
  const [setupProgress, setSetupProgress] = useState(0);

  const tokens = getTokensForChain(chainId).filter((token) => !token.isNative);

  // Check which tokens need setup
  const checkTokenApprovals = async () => {
    if (!address || !selectedTokens.length) return;

    const approvals: {[key: string]: boolean} = {};
    
    for (const token of selectedTokens) {
      try {
        // Check if token is already approved to Permit2
        const response = await fetch(
          `https://${chainId === 11155111 ? 'sepolia.' : ''}etherscan.io/api?module=proxy&action=eth_call&to=${token.address}&data=0xdd62ed3e${address.slice(2).padStart(64, '0')}${PERMIT2_ADDRESS.slice(2).padStart(64, '0')}&tag=latest`
        );
        const data = await response.json();
        
        if (data.result) {
          const allowanceValue = BigInt(data.result);
          approvals[token.address] = allowanceValue > BigInt(0);
        } else {
          approvals[token.address] = false;
        }
      } catch (err) {
        approvals[token.address] = false;
      }
    }
    
    setTokenApprovals(approvals);
    
    // Check if we can skip to batch step
    const allApproved = selectedTokens.every(token => approvals[token.address]);
    if (allApproved && selectedTokens.length > 0) {
      setCurrentStep("batch");
    } else {
      setCurrentStep("setup");
    }
  };

  useEffect(() => {
    checkTokenApprovals();
  }, [selectedTokens, address]);

  // Setup: Approve tokens to Permit2
  const handleSetupApproval = async (tokenAddress: string) => {
    try {
      setStatus(`Approving ${tokenAddress} to Permit2...`);
      
      const tx = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PERMIT2_ADDRESS, maxUint256], // Infinite approval
      });

      setStatus(`✅ Setup approval sent: ${tx}`);
      
      // Update approval status
      setTokenApprovals(prev => ({
        ...prev,
        [tokenAddress]: true
      }));

      // Update progress
      const approvedCount = Object.values({...tokenApprovals, [tokenAddress]: true}).filter(Boolean).length;
      setSetupProgress((approvedCount / selectedTokens.length) * 100);

    } catch (err: any) {
      setStatus(`❌ Setup failed: ${err.message}`);
    }
  };

  // Batch approve using direct contract calls (since Permit2 still needs setup)
  const handleDirectBatchApprove = async () => {
    try {
      setStatus("Starting batch approvals...");
      
      for (let i = 0; i < selectedTokens.length; i++) {
        const token = selectedTokens[i];
        const decimals = token.decimals ?? 18;
        const parsedAmount = parseUnits(amount, decimals);

        setStatus(`Approving ${token.symbol} (${i + 1}/${selectedTokens.length})...`);

        const tx = await writeContractAsync({
          address: token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [spender, parsedAmount],
        });

        setStatus(`✅ ${token.symbol} approved: ${tx}`);
      }

      setStatus("✅ All tokens approved successfully!");
      
    } catch (err: any) {
      setStatus(`❌ Batch approval failed: ${err.message}`);
    }
  };

  const needsSetup = selectedTokens.some(token => !tokenApprovals[token.address]);
  const allSetup = selectedTokens.length > 0 && selectedTokens.every(token => tokenApprovals[token.address]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Token Selection */}
      <div className="space-y-3">
        <Label className="text-sm sm:text-base font-medium">Select Tokens</Label>
        <TokenSelect tokens={tokens} onChange={setSelectedTokens} />
      </div>

      {/* Setup Status */}
      {selectedTokens.length > 0 && (
        <Alert>
          <AlertDescription>
            {needsSetup ? (
              <>
                🔧 <strong>Setup Required:</strong> Some tokens need one-time approval to enable batch operations.
                <div className="mt-2 space-y-2">
                  {selectedTokens.map(token => (
                    <div key={token.address} className="flex items-center justify-between">
                      <span className="text-sm">{token.symbol}</span>
                      {tokenApprovals[token.address] ? (
                        <span className="text-green-600 text-sm">✅ Ready</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetupApproval(token.address)}
                          className="text-xs"
                        >
                          Setup
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <span className="text-green-600">✅ All tokens are set up for batch operations!</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Spender and Amount inputs */}
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

      {/* Action Buttons */}
      {selectedTokens.length > 0 && spender && amount && (
        <div className="space-y-3">
          <Button
            onClick={handleDirectBatchApprove}
            disabled={!isConnected}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Direct Batch Approve ({selectedTokens.length} transactions)
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            Note: This will create {selectedTokens.length} separate transactions, one for each token.
            <br />
            No way around it - each token approval requires its own transaction.
          </div>
        </div>
      )}

      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
}

export default HybridBatchApprove;
