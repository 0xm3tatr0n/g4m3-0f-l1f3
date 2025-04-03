/**
 * Token Extraction and Minting Script
 * 
 * This script can:
 * 1. Extract all existing tokens to static files
 * 2. Mint N additional tokens
 * 3. Mint tokens until reaching a specific end count
 * 
 * Usage:
 *   node extract-tokens.js extract           # Extract all existing tokens
 *   node extract-tokens.js mint 10           # Mint 10 new tokens and extract them
 *   node extract-tokens.js mintToEnd 100     # Mint until reaching 100 total tokens
 */

const ethers = require("ethers");
const fs = require("fs-extra");
const path = require("path");

async function main() {
  // Command line arguments
  const args = process.argv.slice(2);
  const mode = args[0]; // "extract", "mint", or "mintToEnd"
  const count = args[1] ? parseInt(args[1]) : 0;
  
  if (!mode) {
    console.log("Please specify a mode: extract, mint, or mintToEnd");
    process.exit(1);
  }
  
  console.log(`Running in ${mode} mode${count ? ` with count ${count}` : ''}`);
  
  // Connect to local network
  console.log("Connecting to local network...");
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = provider.getSigner();
  const signerAddress = await signer.getAddress();
  console.log(`Connected with address: ${signerAddress}`);
  
  // Load contract artifact and connect
  try {
    // Try to load contract information
    console.log("Loading contract...");
    const contractAddress = require("../src/contracts/G4m3.address.js");
    const contractAbi = require("../src/contracts/G4m3.abi.js");
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);
    
    // Create output directory
    const outputDir = path.join(__dirname, "../src/assets/tokens");
    fs.ensureDirSync(outputDir);
    console.log(`Output directory: ${outputDir}`);
    
    // Get current total supply
    const totalSupply = await contract.totalSupply();
    console.log(`Current total supply: ${totalSupply.toString()}`);
    
    if (mode === "extract" || mode === "extract-all") {
      // Extract all existing tokens
      console.log("Extracting all tokens...");
      await extractTokens(contract, outputDir, totalSupply.toNumber());
    }
    
    if (mode === "mint" && count > 0) {
      // Mint N additional tokens
      console.log(`Minting ${count} new tokens...`);
      await mintTokens(contract, count, signerAddress);
      
      // Check if we should extract tokens (default is yes)
      const skipExtraction = process.env.SKIP_EXTRACTION === "true";
      
      if (skipExtraction) {
        console.log(`🚫 Skipping token extraction as requested by SKIP_EXTRACTION flag`);
      } else {
        // Get updated supply
        const newSupply = await contract.totalSupply();
        // Extract the newly minted tokens
        const startFrom = newSupply.toNumber() - count;
        console.log(`📥 Extracting newly minted tokens...`);
        await extractTokens(contract, outputDir, count, startFrom);
      }
    }
    
    if (mode === "mintToEnd" && count > totalSupply.toNumber()) {
      // Mint until reaching a specific end count
      const toMint = count - totalSupply.toNumber();
      console.log(`Minting ${toMint} tokens to reach total of ${count}...`);
      await mintTokens(contract, toMint, signerAddress);
      
      // Check if we should extract tokens (default is yes)
      const skipExtraction = process.env.SKIP_EXTRACTION === "true";
      
      if (skipExtraction) {
        console.log(`🚫 Skipping token extraction as requested by SKIP_EXTRACTION flag`);
      } else {
        // Extract all tokens to ensure we have everything
        const newSupply = await contract.totalSupply();
        console.log(`📥 Extracting all tokens...`);
        await extractTokens(contract, outputDir, newSupply.toNumber());
      }
    }
    
    // Update manifest
    await updateManifest(outputDir);
    
    // Update import statements in staticTokenLoader.js
    await updateImports(outputDir);
    
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

async function extractTokens(contract, outputDir, count, startFrom = 0) {
  console.log(`Extracting ${count} tokens starting from ID ${startFrom + 1}...`);
  
  for (let i = startFrom + 1; i <= startFrom + count; i++) {
    try {
      const tokenURI = await contract.tokenURI(i);
      const base64Data = tokenURI.split('base64,')[1];
      const jsonData = Buffer.from(base64Data, 'base64').toString();
      const tokenData = JSON.parse(jsonData);
      
      // Add id property if not present
      if (!tokenData.id) tokenData.id = i;
      
      // Write to file
      fs.writeFileSync(
        path.join(outputDir, `${i}.json`),
        JSON.stringify(tokenData, null, 2)
      );
      
      console.log(`Extracted token #${i}`);
    } catch (error) {
      console.error(`Error extracting token #${i}:`, error.message);
    }
  }
}

async function mintTokens(contract, count, address) {
  console.log(`Minting ${count} tokens to ${address}...`);
  
  for (let i = 0; i < count; i++) {
    try {
      console.log(`Minting token ${i+1}/${count}...`);
      
      const tx = await contract.mintItem(address, {
        value: ethers.utils.parseEther("0.02")
      });
      
      console.log(`Transaction hash: ${tx.hash}`);
      console.log("Waiting for confirmation...");
      
      await tx.wait();
      console.log(`✅ Minted token #${i+1}/${count}`);
    } catch (error) {
      console.error(`Error minting token #${i+1}:`, error.message);
    }
  }
}

async function updateManifest(outputDir) {
  console.log("Updating manifest data...");
  
  // Get all token files
  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.json') && !f.includes('manifest'));
  
  // Get min and max token IDs
  const tokenIds = files.map(f => parseInt(f.replace('.json', '')));
  const minTokenId = Math.min(...tokenIds);
  const maxTokenId = Math.max(...tokenIds);
  
  // Create manifest
  const manifest = {
    lastUpdated: new Date().toISOString(),
    totalTokensStored: files.length,
    minTokenId,
    maxTokenId,
    version: "1.0"
  };
  
  console.log("Manifest data:", manifest);
  
  // Update staticTokenLoader.js with this information
  const staticLoaderPath = path.join(__dirname, "../src/helpers/staticTokenLoader.js");
  let staticLoaderContent = fs.readFileSync(staticLoaderPath, 'utf8');
  
  // Replace the manifest data
  const manifestRegex = /const staticManifestData = \{[\s\S]*?\};/;
  const manifestMatch = staticLoaderContent.match(manifestRegex);
  
  if (manifestMatch) {
    staticLoaderContent = staticLoaderContent.replace(
      manifestRegex,
      `const staticManifestData = ${JSON.stringify(manifest, null, 2)};`
    );
    
    fs.writeFileSync(staticLoaderPath, staticLoaderContent);
    console.log("Updated manifest in staticTokenLoader.js");
  } else {
    console.warn("Could not find manifest data in staticTokenLoader.js");
  }
}

async function updateImports(outputDir) {
  console.log("Updating import statements in staticTokenLoader.js...");
  
  // Get all token files
  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.json') && !f.includes('manifest'))
    .sort((a, b) => parseInt(a) - parseInt(b));
  
  const tokenIds = files.map(f => parseInt(f.replace('.json', '')));
  
  // Generate import statements
  const imports = tokenIds.map(id => `import token${id} from '../assets/tokens/${id}.json';`).join('\n');
  
  // Generate token mapping
  const mappings = tokenIds.map(id => `  ${id}: token${id},`).join('\n');
  
  const staticTokensObject = `const staticTokens = {\n${mappings}\n};`;
  
  // Update staticTokenLoader.js
  const staticLoaderPath = path.join(__dirname, "../src/helpers/staticTokenLoader.js");
  let staticLoaderContent = fs.readFileSync(staticLoaderPath, 'utf8');
  
  // Find the imports section
  const importsRegex = /\/\/ Import all token data dynamically[\s\S]*?const staticTokens = \{[\s\S]*?\};/;
  const importsMatch = staticLoaderContent.match(importsRegex);
  
  if (importsMatch) {
    staticLoaderContent = staticLoaderContent.replace(
      importsRegex,
      `// Import all token data dynamically\n${imports}\n\n// Map of token ID to token data\n${staticTokensObject}`
    );
    
    fs.writeFileSync(staticLoaderPath, staticLoaderContent);
    console.log("Updated import statements in staticTokenLoader.js");
  } else {
    console.warn("Could not find import section in staticTokenLoader.js");
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });