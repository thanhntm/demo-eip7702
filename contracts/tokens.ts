export interface Token {
    address: string
    decimals: number
    name: string
    symbol: string
    isNative: boolean
    isWrapped: boolean
    icon?: string
    chainId?: number // Add chainId to identify which network this token belongs to
  }

// Token addresses by chain ID
export const TOKEN_ADDRESSES = {
  // Ethereum Mainnet (Chain ID: 1)
  1: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Real USDT
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Real USDC
  },
  // Sepolia Testnet (Chain ID: 11155111) - Using WETH as test tokens since they're guaranteed to exist
  11155111: {
    USDT: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // Sepolia WETH (reliable test token)
    USDC: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Sepolia ChainLink Token (reliable test token)
  },
  // BSC Mainnet (Chain ID: 56)
  56: {
    USDT: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC USDC
  }
};

// Function to get tokens for a specific chain
export const getTokensForChain = (chainId: number): Token[] => {
  const addresses = TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES];
  
  if (!addresses) {
    // Fallback to mainnet if chain not supported
    return getTokensForChain(1);
  }

  return [
    {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      name: chainId === 56 ? "BNB" : "Ethereum",
      symbol: chainId === 56 ? "BNB" : "ETH",
      isNative: true,
      isWrapped: false,
      icon: chainId === 56 ? 'https://bscscan.com/token/images/bnbchain2_32.png' : 'https://etherscan.io/token/images/ethereum_28.png',
      chainId
    },
    {
      address: addresses.USDT,
      decimals: chainId === 1 ? 6 : 18, // Real USDT on mainnet has 6 decimals, testnets usually 18
      name: "USDT",
      symbol: "USDT",
      isNative: false,
      isWrapped: false,
      icon: 'https://bscscan.com/token/images/busdt_32.png',
      chainId
    },
    {
      address: addresses.USDC,
      decimals: chainId === 1 ? 6 : 18, // Real USDC on mainnet has 6 decimals, testnets usually 18
      name: "USDC",
      symbol: "USDC",
      isNative: false,
      isWrapped: false,
      icon: 'https://bscscan.com/token/images/centre-usdc_28.png',
      chainId
    }
  ];
};

// Default export for backward compatibility (Mainnet tokens)
export const TOKENS: Token[] = getTokensForChain(1);