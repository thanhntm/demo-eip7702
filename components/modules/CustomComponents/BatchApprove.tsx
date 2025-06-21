import { TaskModule, useTaskStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import TokenSelect from "./TokenSelect";
import { Token, TOKENS } from "@/contracts/tokens";
import { Abi, AbiItem, Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { usePublicClient, useAccount } from "wagmi";

const BatchApprove = (module: TaskModule) => {
  const updateModule = useTaskStore((state) => state.updateModule);
  const [amount, setAmount] = useState("");
  const [spenderAddress, setSpenderAddress] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [allowances, setAllowances] = useState<{[key: string]: string}>({});
  const [checking, setChecking] = useState(false);
  
  const publicClient = usePublicClient();
  const { address } = useAccount();

  // token选择
  const tokens = TOKENS.filter((token) => !token.isNative);
  const handleTokenChange = (tokens: Token[]) => {
    console.log(tokens);
    setSelectedTokens(tokens);
  };


  console.log('module22===>', module);

  // Check allowances function
  const checkAllowances = async () => {
    if (!address || !spenderAddress || !selectedTokens.length || !publicClient) {
      console.log("Missing requirements for checking allowances");
      return;
    }

    setChecking(true);
    const newAllowances: {[key: string]: string} = {};

    try {
      for (const token of selectedTokens) {
        const allowance = await publicClient.readContract({
          address: token.address as Address,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, spenderAddress as Address]
        });

        // Format the allowance based on token decimals
        const formattedAllowance = Number(allowance) / Math.pow(10, token.decimals);
        newAllowances[token.address] = formattedAllowance.toString();
        
        console.log(`${token.symbol} allowance:`, formattedAllowance);
      }
      
      setAllowances(newAllowances);
    } catch (error) {
      console.error("Error checking allowances:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    console.log('selectedTokens===>', selectedTokens);
    if(!selectedTokens.length) return;
    try {
        const instructions = selectedTokens.map(token => {
            const data = encodeFunctionData({
                abi:erc20Abi,
                functionName: 'approve',
                args: [
                    spenderAddress as Address,
                    parseUnits(amount, token.decimals)
                ]
            })
            return {
                data,
                to:token.address as Address,
            }
        })
    
        console.log('instructions===>', instructions);
    
        updateModule(module.id, {
          params: {
            ...module.params,
            selectedTokens,
            spenderAddress,
            amount,
          },
          customInstructions: instructions,
        });
    } catch (error) {
        console.log('error===>', error);
    }
  }, [selectedTokens, spenderAddress, amount]);

  return (
    <>
      {/* Token Selection */}
      <div className="space-y-2 col-span-2">
        <Label>Select Tokens</Label>
        <TokenSelect tokens={tokens} onChange={handleTokenChange} />
      </div>

      {/* Spender Address */}
      <div className="space-y-2">
        <Label htmlFor="spenderAddress">Spender Address</Label>
        <Input
          id="spenderAddress"
          placeholder="Enter spender address"
          value={spenderAddress}
          onChange={(e) => setSpenderAddress(e.target.value)}
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          placeholder="Enter approval amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* Check Allowances Button */}
      <div className="space-y-2 col-span-2">
        <Button 
          onClick={checkAllowances}
          disabled={checking || !address || !spenderAddress || !selectedTokens.length}
          variant="outline"
          className="w-full"
        >
          {checking ? "Checking..." : "Check Current Allowances"}
        </Button>
      </div>

      {/* Display Allowances */}
      {Object.keys(allowances).length > 0 && (
        <div className="space-y-2 col-span-2">
          <Label>Current Allowances</Label>
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            {selectedTokens.map(token => (
              <div key={token.address} className="flex justify-between items-center">
                <span className="font-medium">{token.symbol}:</span>
                <span className="text-green-600">
                  {allowances[token.address] || "0"} {token.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BatchApprove;
