const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting SafeBatchApprove deployment...");
  
  // Get the network information
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying to network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Ensure sufficient balance for mainnet deployment
  if (network.chainId === 1n && balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for mainnet deployment. Need at least 0.01 ETH for gas fees.");
  }
  
  // Get the contract factory
  const SafeBatchApprove = await ethers.getContractFactory("SafeBatchApprove");
  
  // Estimate deployment cost
  const deployTx = await SafeBatchApprove.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  const gasPrice = await ethers.provider.getFeeData();
  
  console.log(`Estimated gas: ${estimatedGas.toString()}`);
  console.log(`Gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei")} gwei`);
  
  const estimatedCost = estimatedGas * (gasPrice.gasPrice || 0n);
  console.log(`Estimated deployment cost: ${ethers.formatEther(estimatedCost)} ETH`);
  
  // Deploy the contract
  console.log("Deploying SafeBatchApprove...");
  const safeBatchApprove = await SafeBatchApprove.deploy();
  
  // Wait for deployment
  await safeBatchApprove.waitForDeployment();
  const contractAddress = await safeBatchApprove.getAddress();
  
  console.log("SafeBatchApprove deployed to:", contractAddress);
  
  // Get deployment transaction details
  const deploymentTx = safeBatchApprove.deploymentTransaction();
  if (deploymentTx) {
    console.log("Deployment transaction hash:", deploymentTx.hash);
    
    // Wait for confirmations
    const receipt = await deploymentTx.wait();
    console.log(`Deployment confirmed in block: ${receipt?.blockNumber}`);
    console.log(`Gas used: ${receipt?.gasUsed.toString()}`);
    console.log(`Actual cost: ${ethers.formatEther((receipt?.gasUsed || 0n) * (receipt?.gasPrice || 0n))} ETH`);
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTxHash: deploymentTx?.hash,
    blockNumber: deploymentTx ? (await deploymentTx.wait())?.blockNumber : null,
    timestamp: new Date().toISOString(),
    gasUsed: deploymentTx ? (await deploymentTx.wait())?.gasUsed.toString() : null,
  };
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `${network.name}_deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to: ${deploymentFile}`);
  
  // Verification instructions
  if (network.chainId === 1n || network.chainId === 11155111n) {
    console.log("\n=== VERIFICATION ===");
    console.log("To verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${contractAddress}`);
    console.log("\nMake sure to set your ETHERSCAN_API_KEY in the .env file");
  }
  
  console.log("\n=== DEPLOYMENT COMPLETED SUCCESSFULLY ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Explorer URL: ${getExplorerUrl(network.chainId, contractAddress)}`);
}

function getExplorerUrl(chainId, address) {
  switch (chainId) {
    case 1n:
      return `https://etherscan.io/address/${address}`;
    case 11155111n:
      return `https://sepolia.etherscan.io/address/${address}`;
    default:
      return `Chain ID ${chainId} - ${address}`;
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
