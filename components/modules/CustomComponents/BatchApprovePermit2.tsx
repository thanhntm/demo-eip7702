import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignTypedData, useWriteContract } from "wagmi";
import { mainnet } from "wagmi/chains";
import { parseEther } from "viem";
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
];

function Permit2Demo() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

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

      setStatus("Signing and sending permit...");
      setTxHash("");

      const now = Math.floor(Date.now() / 1000);
      const deadline = now + 60 * 60; // 1h
      const details = selectedTokens.map((token, i) => ({
        token: token.address,
        amount: parseEther(amount),
        expiration: 9999999999,
        nonce: i, // demo, thực tế nên lấy nonce thực tế
      }));
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
          chainId: mainnet.id,
          verifyingContract: PERMIT2_ADDRESS,
        },
        types,
        primaryType: "PermitBatch",
        message,
      });
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