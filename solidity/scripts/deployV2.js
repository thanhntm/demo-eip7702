const hre = require("hardhat");

async function main() {
  console.log("Deploying SafeBatchApproveV2...");

  const SafeBatchApproveV2 = await hre.ethers.getContractFactory("SafeBatchApproveV2");
  const safeBatchApprove = await SafeBatchApproveV2.deploy();

  await safeBatchApprove.waitForDeployment();
  const contractAddress = await safeBatchApprove.getAddress();

  console.log("SafeBatchApproveV2 deployed to:", contractAddress);

  // Wait for block confirmations before verification
  console.log("Waiting for block confirmations...");
  await safeBatchApprove.deploymentTransaction().wait(6);

  // Verify the contract
  try {
    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.log("Verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
