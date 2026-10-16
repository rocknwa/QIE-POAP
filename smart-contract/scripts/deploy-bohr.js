const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying PEOPLE Bohr pilot");
  console.log("Deployer:", deployer.address);

  const network = await ethers.provider.getNetwork();

  if (network.chainId !== 968n) {
    throw new Error(
      `Wrong network. Expected Bohr (968), got ${network.chainId}`
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "BOT");

  // Bohr currently reports a 20 gwei minimum priority fee.
  // Use 25 gwei for both fields to provide some margin.
  const fee = ethers.parseUnits("25", "gwei");

  const txOverrides = {
    maxFeePerGas: fee,
    maxPriorityFeePerGas: fee,
  };

  console.log("Gas fee:", ethers.formatUnits(fee, "gwei"), "gwei");

  // Deploy claim controller
  console.log("\nDeploying POAPDapp...");

  const POAPDapp = await ethers.getContractFactory("POAPDapp");

  const poapDapp = await POAPDapp.deploy(txOverrides);

  console.log(
    "POAPDapp deployment tx:",
    poapDapp.deploymentTransaction().hash
  );

  await poapDapp.waitForDeployment();

  const poapDappAddress = await poapDapp.getAddress();

  console.log("POAPDapp:", poapDappAddress);

  // Deploy NFT factory
  console.log("\nDeploying POAPFactory...");

  const POAPFactory = await ethers.getContractFactory("POAPFactory");

  const poapFactory = await POAPFactory.deploy(txOverrides);

  console.log(
    "POAPFactory deployment tx:",
    poapFactory.deploymentTransaction().hash
  );

  await poapFactory.waitForDeployment();

  const poapFactoryAddress = await poapFactory.getAddress();

  console.log("POAPFactory:", poapFactoryAddress);

  console.log("\n====================================");
  console.log("PEOPLE Bohr deployment complete");
  console.log("====================================");
  console.log("POAPDapp:   ", poapDappAddress);
  console.log("POAPFactory:", poapFactoryAddress);
  console.log("Owner:      ", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});