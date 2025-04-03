const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  const balance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  // Deploy the Moderation contract
  console.log("Deploying Moderation contract...");
  const Moderation = await hre.ethers.getContractFactory("Moderation");
  const moderation = await Moderation.deploy();
  await moderation.deployed();
  console.log(`Moderation contract deployed to: ${moderation.address}`);

  // Deploy mock Governance token
  console.log("Deploying a mock Governance token...");
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Governance Token", "GOV");
  await mockToken.deployed();
  console.log(`Mock Governance token deployed to: ${mockToken.address}`);

  // Deploy Governance contract
  console.log("Deploying Governance contract...");
  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(mockToken.address);
  await governance.deployed();
  console.log(`Governance contract deployed to: ${governance.address}`);

  // Configure roles
  console.log("Setting up initial roles...");
  const MODERATOR_ROLE = await moderation.MODERATOR_ROLE();
  await moderation.grantRole(MODERATOR_ROLE, governance.address);
  console.log(`Granted MODERATOR_ROLE to Governance contract`);

  console.log("Deployment completed!");

  return {
    moderation: moderation.address,
    governance: governance.address,
    token: mockToken.address
  };
}

main()
  .then((addresses) => {
    console.log("Deployed addresses:", addresses);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });