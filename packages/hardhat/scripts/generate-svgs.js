// Script to generate SVGs from the G4m3 contract
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

async function main() {
  console.log("Starting SVG generation script...");
  
  try {
    // Deploy libraries first
    const BitOps = await hre.ethers.getContractFactory("BitOps");
    const bitOps = await BitOps.deploy();
    await bitOps.deployed();
    console.log("BitOps deployed to:", bitOps.address);
    
    const G0l = await hre.ethers.getContractFactory("G0l");
    const g0l = await G0l.deploy();
    await g0l.deployed();
    console.log("G0l deployed to:", g0l.address);
    
    // Deploy main contract
    const G4m3 = await hre.ethers.getContractFactory("G4m3", {
      libraries: {
        BitOps: bitOps.address,
        G0l: g0l.address
      }
    });
    const g4m3 = await G4m3.deploy();
    await g4m3.deployed();
    console.log("G4m3 deployed to:", g4m3.address);
    
    // Fast forward time to enable public minting
    await hre.network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await hre.network.provider.send("evm_mine");
    
    const [owner] = await hre.ethers.getSigners();
    const tokenURIs = [];
    const maxTokens = 10; // Generate 10 tokens
    
    // Mint tokens
    for (let i = 1; i <= maxTokens; i++) {
      try {
        console.log(`Minting token #${i}...`);
        const tx = await g4m3.mintItem(owner.address, {
          value: hre.ethers.utils.parseEther("0.02")
        });
        await tx.wait();
        
        // Get token URI
        const tokenURI = await g4m3.tokenURI(i);
        console.log(`Generated tokenURI for #${i} (length: ${tokenURI.length})`);
        
        // Parse base64 data
        const base64 = tokenURI.split('base64,')[1];
        const jsonString = Buffer.from(base64, 'base64').toString();
        const metadata = JSON.parse(jsonString);
        
        // Log info
        console.log(`Token #${i} - Name: ${metadata.name}`);
        tokenURIs.push(metadata);
      } catch (error) {
        console.error(`Error processing token #${i}:`, error);
        break;
      }
    }
    
    // Save results in an organized directory structure
    const runId = uuidv4();
    const baseDir = path.join(__dirname, "..", "exerpts", "runs");
    
    // Create a dedicated run directory with the UUID
    const runDir = path.join(baseDir, runId);
    fs.mkdirSync(runDir, { recursive: true });
    
    // Create SVGs subdirectory
    const svgDir = path.join(runDir, "svgs");
    fs.mkdirSync(svgDir, { recursive: true });
    
    // Save metadata.json
    const metadataPath = path.join(runDir, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(tokenURIs, null, 2));
    
    // Extract and save individual SVGs
    for (const metadata of tokenURIs) {
      try {
        // Extract epoch and generation from attributes
        const epochAttr = metadata.attributes.find(a => a.trait_type === "epoch");
        const genAttr = metadata.attributes.find(a => a.trait_type === "generation");
        
        const epoch = epochAttr.value.replace("#", "");
        const generation = genAttr.value;
        
        // Extract SVG from base64 image data
        const svgBase64 = metadata.image.split("base64,")[1];
        const svgContent = Buffer.from(svgBase64, "base64").toString();
        
        // Save to file
        const svgFilename = `${epoch}_${generation}.svg`;
        const svgPath = path.join(svgDir, svgFilename);
        fs.writeFileSync(svgPath, svgContent);
        
        console.log(`Saved SVG: ${svgFilename}`);
      } catch (error) {
        console.error(`Error saving SVG for token ${metadata.name}:`, error);
      }
    }
    
    console.log(`\nRun complete: ${tokenURIs.length} tokens processed`);
    console.log(`- Metadata: ${metadataPath}`);
    console.log(`- SVGs: ${svgDir}`);
    
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });