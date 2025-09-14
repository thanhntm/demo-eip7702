import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignTypedData, useWriteContract, usePublicClient } from "wagmi";
import { mainnet } from "wagmi/chains"; // You can replace with the actual connected chain id dynamically
import { parseUnits } from "viem";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import TokenSelect from "./TokenSelect";
import { TOKENS } from "@/contracts/tokens";

const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

const PERMIT2_ABI = [
  {
    name: "permit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "owner", type: "address" },
      {
        name: "permitBatch",
        type: "tuple",
        components: [
          {
            name: "details",
            type: "tuple[]",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint160" },
              { name: "expiration", type: "uint48" },
              { name: "nonce", type: "uint48" },
            ],
          },
          { name: "spender", type: "address" },
          { name: "sigDeadline", type: "uint256" },
        ],
      },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  // allowance(owner, token, spender) -> (uint160 amount, uint48 expiration, uint48 nonce)
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
  },
];

function Permit2Demo() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();

  const [selectedTokens, setSelectedTokens] = useState<any[]>([]);
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [checking, setChecking] = useState(false);

  const tokens = TOKENS.filter((token) => !token.isNative);
  const handleTokenChange = (tokens: any[]) => setSelectedTokens(tokens);

  async function handlePermit() {
    try {
      if (!address) throw new Error("Wallet not connected");
      if (!spender) throw new Error("Spender address required");
      if (!amount) throw new Error("Amount required");
      if (!selectedTokens.length) throw new Error("Select at least one token");

      setStatus("Fetching current nonces...");
      setTxHash("");

      const now = Math.floor(Date.now() / 1000);
      const deadline = now + 60 * 60; // 1h
      // Fetch real nonces from Permit2 for each (owner, token, spender)
      // allowance(...) returns (amount, expiration, nonce)
      const nonceResults = await Promise.all(
        selectedTokens.map((token) =>
          publicClient!.readContract({
            address: PERMIT2_ADDRESS,
            abi: PERMIT2_ABI,
            functionName: "allowance",
            args: [address, token.address, spender],
          })
        )
      );

      // Parse units per token (fall back to 18 decimals if not provided)
      const details = selectedTokens.map((token, i) => {
        const [, , nonce] = nonceResults[i] as any; // (amount, expiration, nonce)
        const decimals = token.decimals ?? 18;
        return {
          token: token.address,
            // The amount approved per token. Adjust logic if you want different amounts per token.
          amount: parseUnits(amount, decimals),
          expiration: BigInt(9999999999),
          nonce: BigInt(nonce),
        };
      });

      setStatus("Signing typed data...");
      const message = { details, spender, sigDeadline: BigInt(deadline) };
      const types = {
        PermitDetails: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint160" },
          { name: "expiration", type: "uint48" },
          { name: "nonce", type: "uint48" },
        ],
        PermitBatch: [
          { name: "details", type: "PermitDetails[]" },
          { name: "spender", type: "address" },
          { name: "sigDeadline", type: "uint256" },
        ],
      };
      const signature = await signTypedDataAsync({
        domain: {
          name: "Permit2",
          // If you want to support multi-chain, replace mainnet.id with the actual connected chain id.
          chainId: mainnet.id,
          verifyingContract: PERMIT2_ADDRESS,
        },
        types,
        primaryType: "PermitBatch",
        message,
      });
      setStatus("Submitting permit transaction...");
      const tx = await writeContractAsync({
        address: PERMIT2_ADDRESS,
        abi: PERMIT2_ABI,
        functionName: "permit",
        args: [address, message, signature],
      });
      setStatus("✅ Transaction sent successfully");
      setTxHash(tx);
    } catch (err: any) {
      setStatus("❌ Error: " + err.message);
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
            onClick={handlePermit}
            disabled={checking || !isConnected}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Batch Authorize
          </Button>
        </div>
      )}
      {/* Summary Section */}
      {selectedTokens.length > 0 && amount && spender && (
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 space-y-2">
          <h4 className="text-sm font-medium text-blue-900">Transaction Summary</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• Approving {selectedTokens.length} token(s)</div>
            <div>• Amount: {amount} per token</div>
            <div className="break-all">• Spender: {spender.slice(0, 8)}...{spender.slice(-6)}</div>
          </div>
        </div>
      )}
      {status && <p className="mt-2 text-sm">{status}</p>}
      {txHash && (
        <p>
          Tx: <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a>
        </p>
      )}
    </div>
  );
}

export default function BatchApprovePermit2() {
  return (
      <Permit2Demo />
  );
}