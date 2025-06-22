"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskModule, useTaskStore } from "@/lib/store";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import TokenSelectSingle from "./TokenSelectSingle";
import { Alert } from "@/components/ui/alert";
import NotOpenAlert from "./NotOpenAlert";
import { Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { TOKENS } from "@/contracts/tokens";

interface TransferItem {
  owner: string;
  amount: string;
  token: string;
  recipient: string;
}

const BatchTransfer = (module: TaskModule) => {
  const updateModule = useTaskStore((state) => state.updateModule);

  const [transfers, setTransfers] = useState<TransferItem[]>([
    { owner: '', amount: '', token: '', recipient: '' },
  ]);

  const handleAddTransfer = () => {
    setTransfers([...transfers, { owner: '', amount: '', token: '', recipient: '' }]);
  };

  const handleRemoveTransfer = (index: number) => {
    const newTransfers = transfers.filter((_, i) => i !== index);
    setTransfers(newTransfers);
  };

  const handleTransferChange = (
    index: number,
    field: keyof TransferItem,
    value: string
  ) => {
    const newTransfers = transfers.map((transfer, i) => {
      if (i === index) {
        return { ...transfer, [field]: value };
      }
      return transfer;
    });
    setTransfers(newTransfers);
  };

  // Add useEffect to update module parameters and create custom instructions
  useEffect(() => {
    // Filter out empty transfers
    const validTransfers = transfers.filter(
      transfer => transfer.token && transfer.recipient && transfer.amount && transfer.owner
    );

    if (!validTransfers.length) {
      // Clear instructions if no valid transfers
      updateModule(module.id, {
        params: {
          ...module.params,
          transfers: [],
        },
        customInstructions: [],
      });
      return;
    }

    try {
      const instructions = validTransfers.map(transfer => {
        const token = TOKENS.find(t => t.address === transfer.token);
        if (!token) throw new Error(`Token not found: ${transfer.token}`);

        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transferFrom',
          args: [
            transfer.owner as Address,
            transfer.recipient as Address,
            parseUnits(transfer.amount, token.decimals)
          ]
        });

        return {
          data,
          to: token.address as Address,
        };
      });

      updateModule(module.id, {
        params: {
          ...module.params,
          transfers: validTransfers,
        },
        customInstructions: instructions,
      });
    } catch (error) {
      console.log('Batch transfer error:', error);
    }
  }, [transfers, module.id, updateModule]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="space-y-4">
        {transfers.map((transfer, index) => (
          <div key={index} className="p-3 sm:p-4 rounded-lg border border-gray-100 space-y-4">
            {/* Mobile: Stack all fields vertically */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Token</label>
                <TokenSelectSingle
                  value={transfer.token}
                  onChange={(value) => handleTransferChange(index, "token", value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Owner</label>
                <Input
                  id={`owner-${index}`}
                  placeholder="Owner address"
                  value={transfer.owner}
                  onChange={(e) =>
                    handleTransferChange(index, "owner", e.target.value)
                  }
                  className="h-10 bg-white text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Amount</label>
                <Input
                  id={`amount-${index}`}
                  type="number"
                  placeholder="Enter amount"
                  value={transfer.amount}
                  onChange={(e) =>
                    handleTransferChange(index, "amount", e.target.value)
                  }
                  className="h-10 bg-white text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Recipient</label>
                <Input
                  id={`address-${index}`}
                  placeholder="Recipient address"
                  value={transfer.recipient}
                  onChange={(e) =>
                    handleTransferChange(index, "recipient", e.target.value)
                  }
                  className="h-10 bg-white text-sm"
                />
              </div>
            </div>

            {/* Remove button */}
            {transfers.length > 1 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemoveTransfer(index)}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={handleAddTransfer}
          className="h-10 px-4 sm:px-6 hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Transfer
        </Button>
      </div>
    </div>
  );
};

export default BatchTransfer;