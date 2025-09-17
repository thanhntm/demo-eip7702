import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, usePublicClient, useChainId } from "wagmi";
import { mainnet } from "wagmi/chains";
import { parseUnits } from "viem";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import TokenSelect from "./TokenSelect";
import { TOKENS, getTokensForChain } from "@/contracts/tokens";

const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

const PERMIT2_ABI = [
	// transferFrom(address from, address to, uint160 amount, address token)
	{
		name: "transferFrom",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "from", type: "address" },
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint160" },
			{ name: "token", type: "address" },
		],
		outputs: [],
	},
	// batch: transferFromBatch((from, to, amount, token)[] batch)
	{
		name: "transferFromBatch",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{
				name: "batch",
				type: "tuple[]",
				components: [
					{ name: "from", type: "address" },
					{ name: "to", type: "address" },
					{ name: "amount", type: "uint160" },
					{ name: "token", type: "address" },
				],
			},
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


function Permit2TransferFrom() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();	const [selectedTokens, setSelectedTokens] = useState<any[]>([]);
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [status, setStatus] = useState("");
	const [txHashes, setTxHashes] = useState<string[]>([]);
	const [checking, setChecking] = useState(false);

  const tokens = getTokensForChain(chainId).filter((token) => !token.isNative);
  const handleTokenChange = (tokens: any[]) => setSelectedTokens(tokens);	async function handleTransferFrom() {
		try {
			if (!address) throw new Error("Wallet not connected");
			if (!selectedTokens.length) throw new Error("Select at least one token");
			if (!recipient) throw new Error("Recipient address required");
			if (!amount) throw new Error("Amount required");

			setStatus("Sending transfer(s)...");
			setTxHashes([]);

			const txs: string[] = [];
			for (let t = 0; t < selectedTokens.length; t++) {
				const token = selectedTokens[t];
				const decimals = token.decimals ?? 18;
				const tx = await writeContractAsync({
					address: PERMIT2_ADDRESS,
					abi: PERMIT2_ABI,
					functionName: "transferFrom",
					args: [address, recipient, parseUnits(amount, decimals), token.address],
				});
				txs.push(tx);
			}
			setStatus("✅ Transfer(s) sent successfully");
			setTxHashes(txs);
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
			{/* Recipient and Amount Section */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Recipient</Label>
				<Input
					placeholder="Recipient address"
					value={recipient}
					onChange={(e) => setRecipient(e.target.value)}
					className="text-sm"
				/>
				<Label className="text-sm font-medium mt-2">Amount</Label>
				<Input
					placeholder="Amount"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className="text-sm w-32"
				/>
			</div>
			{/* Action Button */}
			{selectedTokens.length > 0 && recipient && amount && (
				<div className="space-y-3">
					<Button
						onClick={handleTransferFrom}
						disabled={checking || !isConnected}
						variant="outline"
						className="w-full"
						size="sm"
					>
						Transfer From (Permit2)
					</Button>
				</div>
			)}
			{/* Summary Section */}
			{selectedTokens.length > 0 && recipient && amount && (
				<div className="bg-blue-50 rounded-lg p-3 sm:p-4 space-y-2">
					<h4 className="text-sm font-medium text-blue-900">Transaction Summary</h4>
					<div className="text-xs text-blue-700 space-y-1">
						<div>• Transferring {amount} of each selected token to {recipient.slice(0, 8)}...{recipient.slice(-6)}</div>
					</div>
				</div>
			)}
			{status && <p className="mt-2 text-sm">{status}</p>}
			{txHashes.length > 0 && (
				<div className="space-y-1">
					{txHashes.map((tx, i) => (
						<p key={i}>
							Tx: <a href={`https://etherscan.io/tx/${tx}`} target="_blank" rel="noreferrer">{tx}</a>
						</p>
					))}
				</div>
			)}
		</div>
	);
}

export default function BatchTransferPermit2() {
	return <Permit2TransferFrom />;
}
