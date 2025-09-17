# SafeBatchApprove Contract Deployment

This project contains the SafeBatchApprove smart contract and deployment setup for Ethereum mainnet.

## Overview

SafeBatchApprove is a smart contract that allows users to approve a spender for multiple ERC20 tokens in a single transaction, using a "safe approve" pattern that's compatible with non-standard tokens like USDT.

## Prerequisites

- **Node.js v18+ recommended** (v16+ minimum, v20/22 LTS preferred)
  - Current: Your system has v22.17.0 ✅
- npm or yarn
- An Ethereum wallet with sufficient ETH for gas fees
- Access to an Ethereum RPC provider (Alchemy, Infura, etc.)
- Etherscan API key (for contract verification)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and fill in your details:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Your deployer account private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Ethereum RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY

# Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 3. Get an RPC Provider

Sign up for a free account at one of these providers:
- [Alchemy](https://www.alchemy.com/)
- [Infura](https://infura.io/)
- [QuickNode](https://www.quicknode.com/)

### 4. Get an Etherscan API Key

1. Go to [Etherscan.io](https://etherscan.io/apis)
2. Create a free account
3. Generate an API key

## Deployment

### Test on Sepolia First (Recommended)

Before deploying to mainnet, test on Sepolia testnet:

1. Get Sepolia ETH from a faucet:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Chainlink Sepolia Faucet](https://faucets.chain.link/)

2. Deploy to Sepolia:
```bash
npm run deploy:sepolia
```

3. Verify the contract:
```bash
npm run verify:sepolia <CONTRACT_ADDRESS>
```

### Deploy to Ethereum Mainnet

⚠️ **IMPORTANT**: Mainnet deployment costs real ETH. Make sure you have enough ETH for gas fees (usually 0.005-0.02 ETH depending on network congestion).

1. **Check your balance**: Ensure your deployer account has sufficient ETH
2. **Review gas prices**: Check current gas prices on [ETH Gas Station](https://ethgasstation.info/)
3. **Deploy**:

```bash
npm run deploy:mainnet
```

4. **Verify the contract**:
```bash
npm run verify:mainnet <CONTRACT_ADDRESS>
```

## Deployment Output

After successful deployment, you'll see:
- Contract address
- Deployment transaction hash
- Gas used and cost
- Etherscan/Explorer link

Deployment information is automatically saved to `deployments/<network>_deployment.json`.

## Available Scripts

- `npm run compile` - Compile the contracts
- `npm run test` - Run tests (if any)
- `npm run deploy:localhost` - Deploy to local Hardhat network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run deploy:mainnet` - Deploy to Ethereum mainnet
- `npm run verify:sepolia` - Verify contract on Sepolia
- `npm run verify:mainnet` - Verify contract on mainnet
- `npm run node` - Start local Hardhat node

## Contract Usage

After deployment, users can interact with the SafeBatchApprove contract:

```solidity
// Example: Approve Uniswap V3 Router for USDC, USDT, and DAI
address[] memory tokens = [
    0xA0b86a33E6441E6e80A61C80C2f6A5DF5D0De5Cf, // USDC
    0xdAC17F958D2ee523a2206206994597C13D831ec7, // USDT  
    0x6B175474E89094C44Da98b954EedeAC495271d0F  // DAI
];

safeBatchApprove.batchApprove(
    tokens,
    0xE592427A0AEce92De3Edee1F18E0157C05861564, // Uniswap V3 Router
    type(uint256).max // Infinite approval
);
```

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses `calldata` for function parameters
- Minimal storage usage
- Optimized loop structure
- Compiler optimization enabled

## Security Considerations

- The contract uses the "safe approve" pattern to handle non-standard tokens
- Always test on testnet first
- Consider using a multisig wallet for mainnet deployments
- Verify the contract source code on Etherscan after deployment

## Troubleshooting

### Common Issues

1. **"Insufficient balance" error**: Your account doesn't have enough ETH for gas fees
2. **"Invalid private key" error**: Check your private key format (no 0x prefix)
3. **RPC connection issues**: Verify your RPC URL and API key
4. **Verification fails**: Ensure the source code matches exactly

### Getting Help

- Check Hardhat documentation: https://hardhat.org/docs
- Ethereum development resources: https://ethereum.org/developers
- For contract-specific issues, review the SafeBatchApprove.sol source code

## License

MIT License - see the contract source for details.
