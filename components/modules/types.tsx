import BatchApprove from "./CustomComponents/BatchApprove"
import BatchApprovePermit2 from "./CustomComponents/BatchApprovePermit2"
import BatchApproveContract from "./CustomComponents/BatchApproveContract"
import BatchTransfer from "./CustomComponents/BatchTransfer"
import BatchTransferPermit2 from "./CustomComponents/BatchTransferPermit2"
import Swap from "./CustomComponents/Swap"

export interface TaskModule {
  id: string
  type: "approve" | "transfer" | "swap" | "custom"
  title: string
  description: string
  icon: string
  params: Record<string, any>
  contractAddress?: string
  abi?: any[]
}

export interface ModuleTemplate {
  id: string
  type: "approve" | "transfer" | "swap" | "custom"
  title: string
  description: string
  icon: string
  defaultParams: Record<string, any>
}

export interface ContractMethod {
  type: string
  name: string
  inputs: {
    name: string
    type: string
  }[]
  stateMutability: string
  payable?: boolean
}

export interface PresetModule {
  id: string
  type: string
  title: string
  description: string
  icon: string
  method: ContractMethod
  defaultParams?: Record<string, any>
  customComponent?: (params:any) => React.ReactNode
}

export const AVAILABLE_MODULES: PresetModule[] = [
  {
    id: "approve",
    type: "approve",
    title: "Batch Approve",
    description: "Batch Approve tokens",
    icon: "🔐",
    method: {
      type: "function",
      name: "approve",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" }
      ],
      stateMutability: "nonpayable"
    },
    customComponent: (params: any) => <BatchApprove {...params} />
  },
  {
    id: "approve-contract",
    type: "approve",
    title: "Batch Approve (Contract)",
    description: "Batch approve tokens using SafeBatchApprove contract",
    icon: "📋",
    method: {
      type: "function",
      name: "batchApprove",
      inputs: [
        { name: "tokens", type: "address[]" },
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" }
      ],
      stateMutability: "nonpayable"
    },
    customComponent: (params: any) => <BatchApproveContract {...params} />
  },
  {
    id: "approve-permit2",
    type: "approve",
    title: "Batch Approve (Permit2)",
    description: "Batch approve tokens using Permit2 (Uniswap)",
    icon: "🧪",
    method: {
      type: "function",
      name: "permit",
      inputs: [
        { name: "owner", type: "address" },
        { name: "permitBatch", type: "tuple" },
        { name: "signature", type: "bytes" }
      ],
      stateMutability: "nonpayable"
    },
    customComponent: (params: any) => <BatchApprovePermit2 {...params} />
  },
  {
    id: "transfer-permit2",
    type: "transfer",
    title: "Batch Transfer (Permit2)",
    description: "Batch transfer tokens using Permit2 (Uniswap)",
    icon: "🚚",
    method: {
      type: "function",
      name: "transferFromBatch",
      inputs: [
        { name: "batch", type: "tuple[]" }
      ],
      stateMutability: "nonpayable"
    },
    customComponent: (params: any) => <BatchTransferPermit2 {...params} />
  },
  {
    id: "transfer",
    type: "transfer",
    title: "Batch Transfer",
    description: "Batch transfer tokens to addresses",
    icon: "💸",
    method: {
      type: "function",
      name: "transferFrom",
      inputs: [
        { name: "owner", type: "address" },
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" }
      ],
      stateMutability: "nonpayable"
    },
    customComponent: (params: any) => <BatchTransfer {...params} />
  },
  {
    id: "swap",
    type: "swap",
    title: "Swap",
    description: "Swap tokens on DEX (Open soon ...)",
    icon: "🔄",
    method: {
      type: "function",
      name: "swapExactTokensForTokens",
      inputs: [
        { name: "amountIn", type: "uint256" },
        { name: "amountOutMin", type: "uint256" },
        { name: "path", type: "address[]" },
        { name: "to", type: "address" },
        { name: "deadline", type: "uint256" }
      ],
      stateMutability: "nonpayable"
    },
    customComponent: (params: any) => <Swap {...params} />
  }
]