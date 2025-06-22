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
            value={spenderAddress}
            onChange={(e) => setSpenderAddress(e.target.value)}
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

      {/* Check Allowances Section */}
      {selectedTokens.length > 0 && spenderAddress && (
        <div className="space-y-3">
          <Button 
            onClick={checkAllowances}
            disabled={checking || !address}
            variant="outline"
            className="w-full"
            size="sm"
          >
            {checking ? "Checking..." : "Check Current Allowances"}
          </Button>

          {/* Display Allowances */}
          {Object.keys(allowances).length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Current Allowances</Label>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                {selectedTokens.map(token => (
                  <div key={token.address} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                        {token.symbol.charAt(0)}
                      </span>
                      <span className="font-medium text-sm">{token.symbol}</span>
                    </div>
                    <span className="text-green-600 text-sm font-medium">
                      {allowances[token.address] || "0"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Section */}
      {selectedTokens.length > 0 && amount && spenderAddress && (
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 space-y-2">
          <h4 className="text-sm font-medium text-blue-900">Transaction Summary</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• Approving {selectedTokens.length} token(s)</div>
            <div>• Amount: {amount} per token</div>
            <div className="break-all">• Spender: {spenderAddress.slice(0, 8)}...{spenderAddress.slice(-6)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchApprove;
