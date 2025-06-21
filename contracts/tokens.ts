export interface Token {
    address: string
    decimals: number
    name: string
    symbol: string
    isNative: boolean
    isWrapped: boolean
    icon?: string
  }

  export const TOKENS: Token[] = [
    {
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
    isNative: true,
    isWrapped: false,
    icon:'https://bscscan.com/token/images/bnbchain2_32.png'
  },
  // {
  //   address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  //   decimals: 18,
  //   name: "Wrapped BNB",
  //   symbol: "WBNB",
  //   isNative: false,
  //   isWrapped: true,
  //   icon:'https://bscscan.com/token/images/bnbchain2_32.png'
  // },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 18,
    name: "USDT",
    symbol: "USDT",
    isNative: false,
    isWrapped: false,
    icon:'https://bscscan.com/token/images/busdt_32.png'
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
    isNative: false,
    isWrapped: false,
    icon:'https://bscscan.com/token/images/centre-usdc_28.png'
  }
]