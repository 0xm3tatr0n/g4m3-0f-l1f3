// Script to extract tokens from the G4m3 contract to static files
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

// Default paths - can be overridden with command line args
const DEFAULT_OUTPUT_DIR = path.join(__dirname, "../../react-app/public/static-tokens");
const MANIFEST_FILENAME = "manifest.json";

// Get task arguments using hardhat's task framework
const OUTPUT_DIR = process.env.OUTPUT_DIR || DEFAULT_OUTPUT_DIR;
const START_TOKEN_ID = process.env.START_TOKEN_ID ? parseInt(process.env.START_TOKEN_ID) : 1;
const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 5;
const MAX_TOKENS = process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS) : 0; // 0 means fetch all available tokens

async function main() {
  console.log(`
======================================================================
  Token Extraction Script - Extract NFT data to static storage
======================================================================
Output Directory: ${OUTPUT_DIR}
Starting Token ID: ${START_TOKEN_ID}
Batch Size: ${BATCH_SIZE}
Max Tokens to Extract: ${MAX_TOKENS === 0 ? "ALL" : MAX_TOKENS}
======================================================================
`);
  
  try {
    // Create output directory if it doesn't exist
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Ensured output directory exists: ${OUTPUT_DIR}`);
    
    // Load manifest if it exists or create a new one
    const manifestPath = path.join(OUTPUT_DIR, MANIFEST_FILENAME);
    let manifest = {
      lastUpdated: new Date().toISOString(),
      totalTokensStored: 0,
      minTokenId: null,
      maxTokenId: null,
      version: "1.0"
    };
    
    if (fs.existsSync(manifestPath)) {
      try {
        const existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        console.log(`📝 Found existing manifest with ${existingManifest.totalTokensStored} tokens`);
        manifest = {
          ...existingManifest,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.warn(`⚠️ Error reading existing manifest, creating new one: ${error.message}`);
      }
    }
    
    // Get contract instance
    console.log(`🔍 Getting contract instance...`);

    // Deploy libraries first
    console.log(`🔨 Deploying libraries first...`);
    const BitOps = await hre.ethers.getContractFactory("BitOps");
    const bitOps = await BitOps.deploy();
    await bitOps.deployed();
    console.log(`✅ BitOps deployed to: ${bitOps.address}`);
    
    const G0l = await hre.ethers.getContractFactory("G0l");
    const g0l = await G0l.deploy();
    await g0l.deployed();
    console.log(`✅ G0l deployed to: ${g0l.address}`);
    
    // Deploy main contract with libraries
    console.log(`🔨 Linking libraries and getting contract instance...`);
    const G4m3 = await hre.ethers.getContractFactory("G4m3", {
      libraries: {
        BitOps: bitOps.address,
        G0l: g0l.address
      }
    });
    
    // If in production, attach to existing contract, otherwise deploy for testing
    let contract;
    if (process.env.CONTRACT_ADDRESS) {
      console.log(`🔗 Attaching to existing contract at ${process.env.CONTRACT_ADDRESS}`);
      contract = await G4m3.attach(process.env.CONTRACT_ADDRESS);
    } else {
      console.log(`🚀 Deploying new contract for testing...`);
      contract = await G4m3.deploy();
      await contract.deployed();
      console.log(`✅ Test contract deployed at: ${contract.address}`);
      
      // Fast forward time to enable public minting if needed
      console.log(`⏰ Fast-forwarding time to enable public minting...`);
      await hre.network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await hre.network.provider.send("evm_mine");
      
      // Enable public minting directly using the correct function
      try {
        console.log(`🔓 Trying to enable public minting...`);
        // Use the toggleMinting function from the contract
        await contract.toggleMinting(true);
        console.log(`✅ Public minting enabled!`);
      } catch (error) {
        console.log(`❌ Could not enable public minting: ${error.message}`);
      }
      
      // Check if we should mint to max capacity
      const mintToMax = process.env.MINT_TO_MAX === "true";
      
      // Get max tokens based on user input or default
      let maxItemsToMint;
      
      // Determine max tokens to mint
      if (mintToMax) {
        // When minting to max, use a very large number - we'll stop on "minted out" error
        maxItemsToMint = 10000; // Arbitrarily large number, we'll stop on contract error
        console.log(`⚠️ MINT_TO_MAX enabled - will mint until contract reports "minted out"`);
        console.log(`⚠️ This may take a while and consume significant resources`);
        console.log(`⏱️ Waiting 5 seconds before proceeding... (CTRL+C to cancel)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        // Not minting to max, use MAX_TOKENS or default
        maxItemsToMint = process.env.MAX_TOKENS && parseInt(process.env.MAX_TOKENS) > 0 
          ? parseInt(process.env.MAX_TOKENS) 
          : 10;
      }
      
      // Mint tokens
      const [owner] = await hre.ethers.getSigners();
      
      // Initialize counter for successful mints
      let successfulMints = 0;
      
      // Mint tokens one by one sequentially, since each token depends on the previous state
      console.log(`🔨 Minting ${maxItemsToMint} tokens sequentially...`);
      
      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 5; // Stop after this many consecutive errors (higher than before)
      
      for (let i = 1; i <= maxItemsToMint; i++) {
        try {
          // Show progress every 5 tokens or for important milestones
          if (i % 5 === 1 || i === maxItemsToMint || i % 100 === 0) {
            console.log(`⏳ Minting token ${i}/${maxItemsToMint} (${Math.round((i/maxItemsToMint)*100)}% complete)`);
          }
          
          // Mint token
          const tx = await contract.mintItem(owner.address, {
            value: hre.ethers.utils.parseEther("0.02")
          });
          await tx.wait();
          successfulMints++;
          consecutiveErrors = 0; // Reset error counter on success
          
          // For large mints, don't spam the console with every token
          if (maxItemsToMint <= 20 || i % 50 === 0 || i === maxItemsToMint) {
            console.log(`   ✅ Token #${i} minted successfully (${successfulMints} total)`);
          }
          
          // Add a small delay to avoid overwhelming the node
          if (i % 10 === 0 && i < maxItemsToMint) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          consecutiveErrors++;
          console.error(`   ❌ Error minting token #${i}: ${error.message}`);
          
          // Check if we've reached max capacity by detecting specific error messages
          if (error.message.includes('minted out') || 
              error.message.includes('max supply') || 
              error.message.includes('maxEpochs') ||
              error.message.includes('exceeds total supply')) {
            console.log(`🛑 Reached maximum capacity at ${successfulMints} tokens`);
            console.log(`📊 Contract reported: "${error.message}"`);
            break;
          }
          
          // Stop if we have too many consecutive errors
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.log(`⚠️ Stopping after ${MAX_CONSECUTIVE_ERRORS} consecutive errors`);
            break;
          }
          
          // Add a delay after errors to let the node recover
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update maxItemsToMint to actual number of successful mints for correct progress reporting
      if (successfulMints < maxItemsToMint) {
        console.log(`ℹ️ Adjusted target from ${maxItemsToMint} to ${successfulMints} tokens based on actual mints`);
        maxItemsToMint = successfulMints;
      }
      
      console.log(`✅ Successfully minted ${successfulMints} tokens!`);
    }
    console.log(`✅ Contract located at ${contract.address}`);
    
    // Get total supply from contract
    const totalSupply = await contract.totalSupply();
    const totalTokens = totalSupply.toNumber();
    console.log(`ℹ️ Total supply from contract: ${totalTokens} tokens`);
    
    // Determine range to fetch
    const startTokenId = START_TOKEN_ID;
    const endTokenId = MAX_TOKENS === 0 
      ? totalTokens
      : Math.min(startTokenId + MAX_TOKENS - 1, totalTokens);
      
    console.log(`🔄 Will process tokens ${startTokenId} to ${endTokenId}`);
    
    // Process tokens in batches
    let processedCount = 0;
    let minTokenId = manifest.minTokenId || Infinity;
    let maxTokenId = manifest.maxTokenId || 0;
    
    for (let i = startTokenId; i <= endTokenId; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE - 1, endTokenId);
      console.log(`\n📦 Processing batch: ${i} - ${batchEnd}`);
      
      const batchPromises = [];
      
      for (let tokenId = i; tokenId <= batchEnd; tokenId++) {
        batchPromises.push(processToken(contract, tokenId, OUTPUT_DIR));
      }
      
      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        const tokenId = i + index;
        
        if (result.status === 'fulfilled' && result.value) {
          processedCount++;
          // Update min/max token IDs
          minTokenId = Math.min(minTokenId, tokenId);
          maxTokenId = Math.max(maxTokenId, tokenId);
          console.log(`   ✅ Token #${tokenId} processed successfully`);
        } else if (result.status === 'rejected') {
          console.log(`   ❌ Token #${tokenId} failed: ${result.reason}`);
        }
      });
      
      // Short delay between batches to avoid rate limiting
      if (i + BATCH_SIZE <= endTokenId) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Update and save manifest
    manifest.totalTokensStored = processedCount + 
      (manifest.totalTokensStored || 0) - 
      countOverlappingTokens(manifest, minTokenId, maxTokenId);
    
    manifest.minTokenId = Math.min(minTokenId, manifest.minTokenId || Infinity);
    if (manifest.minTokenId === Infinity) manifest.minTokenId = null;
    
    manifest.maxTokenId = Math.max(maxTokenId, manifest.maxTokenId || 0);
    if (manifest.maxTokenId === 0) manifest.maxTokenId = null;
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`\n✨ Extraction complete!`);
    console.log(`📊 Processed ${processedCount} tokens`);
    console.log(`📄 Updated manifest at ${manifestPath}`);
    console.log(`📈 Total tokens in static storage: ${manifest.totalTokensStored}`);
    console.log(`🔢 Token ID range: ${manifest.minTokenId} - ${manifest.maxTokenId}`);
    
  } catch (error) {
    console.error(`❌ Error in extraction process:`, error);
  }
}

// Process a single token and save its data
async function processToken(contract, tokenId, outputDir) {
  try {
    // Check if token exists by trying to get its owner
    await contract.ownerOf(tokenId);
    
    // Get token URI
    const tokenURI = await contract.tokenURI(tokenId);
    
    // Parse base64 data
    const base64 = tokenURI.split('base64,')[1];
    const jsonString = Buffer.from(base64, 'base64').toString();
    const metadata = JSON.parse(jsonString);
    
    // Add token ID to metadata
    metadata.id = tokenId;
    
    // Save to file
    const filePath = path.join(outputDir, `${tokenId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    
    return true;
  } catch (error) {
    // If error is because token doesn't exist, just return false
    if (error.message.includes('owner query for nonexistent token')) {
      return false;
    }
    
    // For other errors, throw so we can handle them
    throw new Error(`Error processing token #${tokenId}: ${error.message}`);
  }
}

// Helper to count how many tokens in the new range overlap with existing stored tokens
function countOverlappingTokens(manifest, newMin, newMax) {
  if (!manifest.minTokenId || !manifest.maxTokenId) return 0;
  
  // Check if ranges overlap
  if (newMax < manifest.minTokenId || newMin > manifest.maxTokenId) {
    return 0; // No overlap
  }
  
  // Calculate overlap
  const overlapStart = Math.max(newMin, manifest.minTokenId);
  const overlapEnd = Math.min(newMax, manifest.maxTokenId);
  
  return Math.max(0, overlapEnd - overlapStart + 1);
}

// This function is no longer needed as we handle deployment directly

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });