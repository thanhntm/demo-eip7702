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
    <div className="space-y-6 col-span-2">
      <div className="space-y-4">
        {transfers.map((transfer, index) => (
          <div key={index} className="flex items-end gap-4 p-4 rounded-lg border border-gray-100">
            <div className="w-[160px]">
              <TokenSelectSingle
                value={transfer.token}
                onChange={(value) => handleTransferChange(index, "token", value)}
              />
            </div>
            <div className="w-[160px]">
              <Input
                id={`owner-${index}`}
                placeholder="Owner address"
                value={transfer.owner}
                onChange={(e) =>
                  handleTransferChange(index, "owner", e.target.value)
                }
                className="h-10 bg-white"
              />
            </div>
            <div className="w-[160px]">
              <Input
                id={`amount-${index}`}
                type="number"
                placeholder="Enter amount"
                value={transfer.amount}
                onChange={(e) =>
                  handleTransferChange(index, "amount", e.target.value)
                }
                className="h-10 bg-white"
              />
            </div>
            <div className="flex-1">
              <Input
                id={`address-${index}`}
                placeholder="Enter recipient address"
                value={transfer.recipient}
                onChange={(e) =>
                  handleTransferChange(index, "recipient", e.target.value)
                }
                className="h-10 bg-white"
              />
            </div>

            {transfers.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10"
                onClick={() => handleRemoveTransfer(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={handleAddTransfer}
          className="h-10 px-6 hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Transfer
        </Button>
      </div>
    </div>
  );
};

export default BatchTransfer;