const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  if (network.chainId !== 968n) {
    throw new Error(`Wrong network. Expected Bohr (968), got ${network.chainId}`);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  const fee = ethers.parseUnits("25", "gwei");
  const overrides = { maxFeePerGas: fee, maxPriorityFeePerGas: fee };

  console.log("Deploying PEOPLE POAPDapp V2");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "BOT");
  console.log("Gas fee:", ethers.formatUnits(fee, "gwei"), "gwei");

  const Factory = await ethers.getContractFactory("POAPDapp");
  const controller = await Factory.deploy(overrides);
  console.log("Deployment tx:", controller.deploymentTransaction().hash);
  await controller.waitForDeployment();

  console.log("POAPDapp V2:", await controller.getAddress());
  console.log("Owner:", deployer.address);
  console.log("\nKeep the existing POAPFactory. Update NEXT_PUBLIC_POAP_DAPP_ADDRESS to this V2 address before creating new event NFTs.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
