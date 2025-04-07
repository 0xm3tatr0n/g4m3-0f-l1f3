const { ethers, network } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');

use(solidity);

function decodeTokenURI(tokenURI64) {
  try {
    // Expected format: data:application/json;base64,<base64-encoded-json>
    if (!tokenURI64 || typeof tokenURI64 !== 'string') {
      throw new Error(`Invalid tokenURI: ${tokenURI64}`);
    }
    
    // The base64 part starts after the prefix
    const prefix = 'data:application/json;base64,';
    if (!tokenURI64.startsWith(prefix)) {
      throw new Error(`TokenURI doesn't start with expected prefix: ${tokenURI64.substring(0, 50)}...`);
    }
    
    // Extract the base64 part
    const base64 = tokenURI64.substring(prefix.length);
    
    // Convert base64 to string
    const jsonManifestString = Buffer.from(base64, 'base64').toString();
    
    // Parse JSON and validate
    const jsonManifest = JSON.parse(jsonManifestString);
    
    // Basic validation
    if (!jsonManifest.name || !jsonManifest.attributes) {
      console.warn('Metadata missing required fields:', JSON.stringify(jsonManifest).substring(0, 100) + '...');
    }
    
    return jsonManifest;
  } catch (error) {
    console.error('Error decoding tokenURI:', error.message);
    throw new Error(`Failed to decode tokenURI: ${error.message}`);
  }
}

function extractSVG(metadata) {
  try {
    // Extract SVG from base64 image data
    const svgBase64 = metadata.image.split("base64,")[1];
    const svgContent = Buffer.from(svgBase64, "base64").toString();
    return svgContent;
  } catch (error) {
    console.error(`Error extracting SVG from metadata:`, error);
    return null;
  }
}

function generateSVGFiles(metadata, outputDir) {
  // Create SVGs directory
  const svgDir = path.join(outputDir, "svgs");
  fs.mkdirSync(svgDir, { recursive: true });
  
  // Process each token metadata
  metadata.forEach(token => {
    try {
      // Extract epoch and generation
      const epochAttr = token.attributes.find(a => a.trait_type === "epoch");
      const genAttr = token.attributes.find(a => a.trait_type === "generation");
      
      if (!epochAttr || !genAttr) {
        console.error(`Missing epoch or generation attributes for token ${token.name}`);
        return;
      }
      
      const epoch = epochAttr.value.replace("#", "");
      const generation = genAttr.value;
      
      // Extract SVG content
      const svgContent = extractSVG(token);
      if (!svgContent) return;
      
      // Save to file
      const svgFilename = `${epoch}_${generation}.svg`;
      const svgPath = path.join(svgDir, svgFilename);
      fs.writeFileSync(svgPath, svgContent);
    } catch (error) {
      console.error(`Error saving SVG for token ${token.name}:`, error);
    }
  });
  
  return svgDir;
}

describe('Generate SVGs', function () {
  // Set an extremely long timeout for the full run (2 hours)
  this.timeout(7200000);
  
  let g4m3;
  let owner;
  
  // Handle uncaught exceptions
  process.on('uncaughtException', function(err) {
    console.error('Uncaught Exception:', err.message);
    console.error(err.stack);
  });
  
  it('Should generate SVGs for multiple tokens', async function () {
    // Get signers first
    [owner] = await ethers.getSigners();
    
    // Generate a unique random seed for this test run
    const uniqueTestId = Date.now().toString() + Math.random().toString();
    const customRandomSeed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(uniqueTestId));
    
    // Set a variable future timestamp - this affects randomness
    const timestamp = Math.floor(Date.now()/1000) + parseInt(customRandomSeed.slice(2, 10), 16) % 100000;
    await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    
    // Mine a block with the custom timestamp
    await network.provider.send("evm_mine");
    
    // Generate a few more blocks with different timestamps for additional randomness sources
    for (let i = 0; i < 5; i++) {
      // Each block will have a different timestamp
      await network.provider.send("evm_increaseTime", [59 * (i + 1)]);
      await network.provider.send("evm_mine");
      
      // Add some transactions to create more entropy in the blocks
      const tx = await owner.sendTransaction({
        to: ethers.constants.AddressZero,
        value: ethers.utils.parseEther("0.0001"),
      });
      await tx.wait();
    }
    
    // Record the actual blockhashes and timestamps used (for debugging)
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const previousBlock = await ethers.provider.getBlock(blockNumber - 1);
    
    console.log(`Current block: ${blockNumber}, hash: ${block.hash}, timestamp: ${block.timestamp}`);
    console.log(`Previous block hash: ${previousBlock.hash}, timestamp: ${previousBlock.timestamp}`);
    console.log(`Randomness seed: ${uniqueTestId}`);
    
    // Deploy libraries first
    const BitOpsFactory = await ethers.getContractFactory('BitOps');
    const bitOps = await BitOpsFactory.deploy();
    await bitOps.deployed();
    
    const G0lFactory = await ethers.getContractFactory('G0l');
    const g0l = await G0lFactory.deploy();
    await g0l.deployed();
    
    // Deploy the main contract with linked libraries
    const G4m3Factory = await ethers.getContractFactory('G4m3', {
      libraries: {
        BitOps: bitOps.address,
        G0l: g0l.address
      }
    });
    g4m3 = await G4m3Factory.deploy();
    await g4m3.deployed();
    
    // Fast forward time to enable public minting
    await network.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
    await network.provider.send('evm_mine');
    
    // Generate unique ID for this run
    const run_id = uuid.v4();
    console.log(`Run ID: ${run_id}`);
    
    // Mint tokens and generate SVGs
    const tokenURIs = [];
    const MAX_MINTING_ATTEMPTS = 10000; // High limit to ensure we can reach the end
    
    console.log("Starting full Game of Life simulation until completion...");
    console.log("This will mint tokens until all epochs are exhausted or an error occurs.");
    console.log("=============================================================");
    
    // Progress tracking variables
    let i = 1;
    let currentEpoch = 1;
    let lastGeneration = 0;
    let epochStartToken = 1;
    let epochGenerations = {};
    let startTime = Date.now();
    
    // Function to print progress stats
    const printStats = (currentToken, forced = false) => {
      // Only print every 10 tokens unless forced
      if (!forced && currentToken % 10 !== 0) return;
      
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - startTime) / 1000;
      const tokensPerSecond = currentToken / elapsedSeconds;
      const epochProgress = epochGenerations[currentEpoch] || 0;
      
      console.log("\n----- SIMULATION PROGRESS -----");
      console.log(`Current token: #${currentToken}`);
      console.log(`Current epoch: ${currentEpoch} (${epochProgress} generations)`);
      console.log(`Elapsed time: ${Math.floor(elapsedSeconds / 60)}m ${Math.floor(elapsedSeconds % 60)}s`);
      console.log(`Minting speed: ${tokensPerSecond.toFixed(2)} tokens/second`);
      console.log(`Tokens in this epoch: ${currentToken - epochStartToken + 1}`);
      console.log("-------------------------------\n");
    };
    
    while (i <= MAX_MINTING_ATTEMPTS) {
      try {
        // Check for Hardhat timeout - reset provider connection occasionally
        if (i % 100 === 0) {
          // Force a new block to prevent timeout
          await network.provider.send('evm_mine');
        }
          
        // Mint one token at a time (safer than batching)
        // Enable minting if not already enabled
        if (i === 1) {
          // First check if minting is already active
          const isMintingActive = await g4m3.isMintingActive();
          console.log(`Current minting state: ${isMintingActive ? 'active' : 'inactive'}`);
          
          if (!isMintingActive) {
            console.log("Enabling minting on the contract...");
            const enableTx = await g4m3.toggleMinting(true);
            await enableTx.wait();
            
            // Verify the change took effect
            const newMintingState = await g4m3.isMintingActive();
            console.log(`Minting now: ${newMintingState ? 'active' : 'inactive'}`);
          } else {
            console.log("Minting is already enabled");
          }
        }
        
        // Mint token - add more detailed logging
        console.log(`Attempting to mint token #${i}...`);
        const tx = await g4m3.mintItem(owner.address, {
          value: ethers.utils.parseEther('0.02')
        });
        const receipt = await tx.wait();
        console.log(`Mint transaction confirmed: ${receipt.transactionHash}`);
        
        // Check if token exists by trying to get owner (will revert if token doesn't exist)
        try {
          const owner = await g4m3.ownerOf(i);
          console.log(`Token #${i} exists and is owned by: ${owner}`);
        } catch (error) {
          console.log(`Token #${i} does not exist: ${error.message}`);
        }
        
        // Get token metadata with error handling
        let metadata;
        try {
          const tokenURI = await g4m3.tokenURI(i);
          console.log(`Retrieved tokenURI for #${i}: ${tokenURI.substring(0, 50)}...`);
          
          // Make sure the tokenURI is valid base64
          if (!tokenURI.startsWith('data:application/json;base64,')) {
            console.error(`TokenURI format unexpected: ${tokenURI.substring(0, 50)}...`);
            throw new Error('Invalid tokenURI format');
          }
          
          try {
            metadata = decodeTokenURI(tokenURI);
            console.log(`Successfully decoded metadata for token #${i}`);
          } catch (decodeError) {
            console.error(`Failed to decode tokenURI: ${decodeError.message}`);
            throw decodeError;
          }
        } catch (tokenError) {
          console.error(`Error getting or processing tokenURI: ${tokenError.message}`);
          throw tokenError;
        }
        
        const tokens = [{ 
          id: i, 
          metadata,
          epoch: parseInt(metadata.attributes.find(a => a.trait_type === 'epoch').value.replace('#', '')),
          generation: parseInt(metadata.attributes.find(a => a.trait_type === 'generation').value)
        }];
        
        // Process each token in the batch
        for (const token of tokens) {
          // Extract generation info
          const epochNumber = token.epoch;
          const generationNumber = token.generation;
          
          // Track highest generation per epoch
          if (!epochGenerations[epochNumber] || generationNumber > epochGenerations[epochNumber]) {
            epochGenerations[epochNumber] = generationNumber;
          }
          
          // Print basic token info - compact format to reduce output
          if (i % 20 === 0 || epochNumber !== currentEpoch) {
            console.log(`Token #${token.id}: Epoch ${epochNumber}, Generation ${generationNumber}`);
          } else {
            process.stdout.write('.');  // Just a dot for normal progression
            if (token.id % 50 === 0) process.stdout.write('\n');  // Line break every 50 dots
          }
          
          tokenURIs.push(token.metadata);
          
          // Track epoch transitions to detect completion
          if (epochNumber > currentEpoch) {
            console.log(`\n\n✨ EPOCH TRANSITION: ${currentEpoch} → ${epochNumber} ✨`);
            console.log(`Epoch ${currentEpoch} completed with ${token.id - epochStartToken} tokens and ${lastGeneration} generations\n`);
            
            currentEpoch = epochNumber;
            epochStartToken = token.id;
            lastGeneration = 0;
            
            // Print detailed stats on epoch transition
            printStats(token.id, true);
          }
          
          lastGeneration = generationNumber;
          
          // Check for completion (all epochs exhausted)
          // maxEpochs = 10, so we stop when we reach epoch 11
          if (epochNumber > 10) {
            console.log(`\n\n🎯 ALL EPOCHS EXHAUSTED (${epochNumber} > 10) 🎯`);
            break;
          }
          
          // Check for excessive generations (potential infinite loop)
          if (generationNumber > 500) {
            console.log(`\n\n⚠️ WARNING: Unusually high generation count (${generationNumber}) in epoch ${epochNumber}`);
            console.log("This might indicate a pattern that doesn't terminate. Continuing anyway...\n");
          }
          
          i++;
        }
        
        // Print progress stats periodically
        printStats(i);
        
      } catch (error) {
        console.error(`\n\n🛑 ERROR minting token #${i}:`, error.message);
        console.error("Error details:", error);
        
        // Try to get contract state information for debugging
        try {
          const isMintingActive = await g4m3.isMintingActive();
          console.log(`Minting active: ${isMintingActive}`);
          
          const ownerAddress = await g4m3.owner();
          console.log(`Contract owner: ${ownerAddress}`);
          
          const senderAddress = await owner.getAddress();
          console.log(`Sender address: ${senderAddress}`);
          
          const totalSupply = await g4m3.totalSupply();
          console.log(`Total supply: ${totalSupply}`);
        } catch (stateError) {
          console.error("Failed to get contract state:", stateError.message);
        }
        
        // Check if we hit the "minted out" error, which signals completion
        if (error.message.includes('minted out')) {
          console.log(`\n\n🎉 SIMULATION COMPLETE: "minted out" at token #${i-1} 🎉`);
          console.log(`\nFinal stats:`);
          printStats(i-1, true);
          
          // Print summary of all epochs
          console.log("\n📊 EPOCH SUMMARY 📊");
          for (const [epoch, generations] of Object.entries(epochGenerations)) {
            console.log(`Epoch ${epoch}: ${generations} generations`);
          }
        } else {
          console.log(`\n\n⛔ SIMULATION STOPPED DUE TO ERROR ⛔`);
        }
        break;
      }
    }
    
    if (i >= MAX_MINTING_ATTEMPTS) {
      console.log(`\n=== Reached safety limit of ${MAX_MINTING_ATTEMPTS} tokens ===`);
    }
    
    // Create a summary of the run
    const runSummary = {
      id: run_id,
      totalTokens: tokenURIs.length,
      maxEpochReached: currentEpoch,
      maxGenerationReached: lastGeneration,
      completed: i < MAX_MINTING_ATTEMPTS,
      completionReason: i >= MAX_MINTING_ATTEMPTS ? 'safety limit reached' : 
                        (currentEpoch > 10 ? 'all epochs exhausted' : 'minted out'),
      timestamp: new Date().toISOString(),
      randomSeed: uniqueTestId,
      initialBlockNumber: blockNumber,
      initialBlockHash: block.hash,
      initialBlockTimestamp: block.timestamp,
      previousBlockHash: previousBlock.hash,
      epochGenerations: epochGenerations, // Include complete epoch generation data
      metadata: tokenURIs
    };
    
    // Save results to a file
    const outputDir = path.join(__dirname, '..', 'exerpts', 'runs');
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create a directory for this full run
    const runDir = path.join(outputDir, `full-run-${run_id}`);
    fs.mkdirSync(runDir, { recursive: true });
    
    // Save summary file
    const summaryFile = path.join(runDir, `summary.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(runSummary, null, 2));
    
    // Also save full metadata for compatibility
    const metadataFile = path.join(runDir, `metadata.json`);
    fs.writeFileSync(metadataFile, JSON.stringify(tokenURIs, null, 2));
    
    // Also save one combined file in the original location
    const legacyFile = path.join(outputDir, `${run_id}.json`);
    fs.writeFileSync(legacyFile, JSON.stringify(tokenURIs, null, 2));
    
    // Generate individual SVG files
    console.log("\nGenerating individual SVG files...");
    const svgDir = generateSVGFiles(tokenURIs, runDir);
    console.log(`SVG files saved to: ${svgDir}`);
    
    console.log(`\nGenerated ${tokenURIs.length} tokens through ${currentEpoch} epochs.`);
    console.log(`Full run data saved to: ${runDir}`);
    console.log(`Summary: ${summaryFile}`);
    
    // If we didn't generate any tokens, check contract state for diagnosis
    if (tokenURIs.length === 0) {
      console.log("\n⚠️ No tokens were generated! Checking contract state...");
      
      const isMintingActive = await g4m3.isMintingActive();
      console.log(`Minting active: ${isMintingActive}`);
      
      const balance = await owner.getBalance();
      console.log(`Owner balance: ${ethers.utils.formatEther(balance)} ETH`);
      
      const totalSupply = await g4m3.totalSupply();
      console.log(`Contract total supply: ${totalSupply}`);
      
      // Return without failing to allow investigation
      console.log("Test will continue without failing, but no SVGs were generated");
    }
    
    // Only assert if we're not in debug mode
    if (process.env.DEBUG !== "true") {
      expect(tokenURIs.length).to.be.greaterThan(0);
    }
  });
});