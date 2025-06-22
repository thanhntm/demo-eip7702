import { useState } from "react";
import { Token } from "@/contracts/tokens";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TokenSelectProps {
  tokens: Token[];
  onChange?: (selectedTokens: Token[]) => void;
}

const TokenSelect = ({ tokens, onChange }: TokenSelectProps) => {
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);

  const handleTokenChange = (token: Token, checked: boolean) => {
    const newSelectedTokens = checked
      ? [...selectedTokens, token]
      : selectedTokens.filter((t) => t.address !== token.address);

    setSelectedTokens(newSelectedTokens);
    onChange?.(newSelectedTokens);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tokens.map((token) => (
        <div
          key={token.address}
          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <Checkbox
            id={token.address}
            onCheckedChange={(checked) =>
              handleTokenChange(token, checked as boolean)
            }
          />
          <Label
            htmlFor={token.address}
            className="text-sm font-normal flex items-center space-x-2 flex-1 cursor-pointer min-w-0"
          >
            <img
              src={token.icon}
              alt={token.symbol}
              className="w-5 h-5 flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm">{token.symbol}</span>
              <span className="text-xs text-gray-500 truncate">{token.name}</span>
            </div>
          </Label>
        </div>
      ))}
    </div>
  );
};

export default TokenSelect;
