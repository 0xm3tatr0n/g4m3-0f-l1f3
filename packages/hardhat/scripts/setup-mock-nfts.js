const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("Setting up mock NFTs for local testing...");

  // Get test addresses
  const [deployer, ...testAddresses] = await ethers.getSigners();
  const testAddr = "0x5B310560815EaF364E5876908574b4a9c6eC1B7e"; // The address you want to use in tests

  // Create address array of test accounts we want to set up with tokens
  const testAccounts = [
    testAddr,
    deployer.address, // Include the deployer address too
    "0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295", // Additional test address
    "0x5641b67F2637d7c605eae9fAee8E83D7EA1B3fb9"  // Additional test address
  ];

  // The exact addresses specified in the G4m3 contract
  const terraformsAddress = "0x4E1f41613c9084FdB9E34E11fAE9412427480e56";
  const chaosRoadsAddress = "0x18Adc812fE66B9381700C2217f0c9DC816c879E6";

  console.log("Using a simpler approach - modifying G4m3 contract to use our test contracts...");

  // We'll directly modify the storage of the G4m3 contract to point to our mock contracts
  // First, we need to deploy actual mock NFT contracts
  console.log("Deploying mock NFT contracts...");
  const MockNFT = await ethers.getContractFactory("MockNFT");
  
  const terraformsMock = await MockNFT.deploy("Terraforms", "TERRA");
  await terraformsMock.deployed();
  console.log(`Deployed Terraforms mock to: ${terraformsMock.address}`);
  
  const chaosRoadsMock = await MockNFT.deploy("Chaos Roads", "CHAOS");  
  await chaosRoadsMock.deployed();
  console.log(`Deployed Chaos Roads mock to: ${chaosRoadsMock.address}`);

  // Find the deployed G4m3 contract
  const G4m3Address = require("../artifacts/G4m3.address");
  console.log(`Located G4m3 contract at: ${G4m3Address}`);
  
  const g4m3 = await ethers.getContractAt("G4m3", G4m3Address);
  
  // For each test account, set some NFT balances
  console.log("Setting balances for test accounts...");
  
  for (const account of testAccounts) {
    try {
      // Set a balance of 1 Terraform for each account
      await terraformsMock.setBalance(account, 1);
      console.log(`Set Terraforms balance of 1 for ${account}`);
      
      // Set a balance of 2 Chaos Roads for each account
      await chaosRoadsMock.setBalance(account, 2);
      console.log(`Set Chaos Roads balance of 2 for ${account}`);
    } catch (error) {
      console.error(`Error setting balance for ${account}:`, error.message);
    }
  }
  
  console.log("Mock NFT setup complete!");
  
  // Log addresses for verification
  console.log("\nMock NFT addresses:");
  console.log(`Terraforms Mock: ${terraformsMock.address}`);
  console.log(`Chaos Roads Mock: ${chaosRoadsMock.address}`);
  console.log("\nExpected addresses in G4m3 contract:");
  console.log(`Terraforms: ${terraformsAddress}`);
  console.log(`Chaos Roads: ${chaosRoadsAddress}`);
  
  // Let users know how to handle this
  console.log("\nIMPORTANT: Since we can't directly modify the G4m3 contract's nftCollections array,");
  console.log("you can test the free mint functionality by using the whitelist feature instead.");
  console.log("Add test addresses to the whitelist using:");
  console.log("await yourCollectible.addUserToWhitelist(testAddress);");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });