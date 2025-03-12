const { ethers, network } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');

use(solidity);

function decodeTokenURI(tokenURI64) {
  // parse base64 tokenURI for later consumption
  const base64 = tokenURI64.substring(29);
  const jsonManifestString = Buffer.from(base64, 'base64').toString();
  const jsonManifest = JSON.parse(jsonManifestString);
  return jsonManifest;
}

describe('Generate SVGs', function () {
  // Set a longer timeout for the whole suite
  this.timeout(300000);
  
  let g4m3;
  let owner;
  
  // Handle uncaught exceptions
  process.on('uncaughtException', function(err) {
    console.error('Uncaught Exception:', err.message);
    console.error(err.stack);
  });
  
  it('Should generate SVGs for multiple tokens', async function () {
    [owner] = await ethers.getSigners();
    
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
    const maxTokens = 20; // Limit to 20 tokens for this test
    
    for (let i = 1; i <= maxTokens; i++) {
      try {
        // Mint a new token
        const tx = await g4m3.mintItem(owner.address, {
          value: ethers.utils.parseEther('0.02')
        });
        await tx.wait();
        
        // Get token URI and metadata
        const tokenURI = await g4m3.tokenURI(i);
        const metadata = decodeTokenURI(tokenURI);
        
        // Extract generation info
        const epochAttr = metadata.attributes.find(a => a.trait_type === 'epoch');
        const genAttr = metadata.attributes.find(a => a.trait_type === 'generation');
        console.log(`Token #${i}: Epoch ${epochAttr.value}, Generation ${genAttr.value}`);
        
        tokenURIs.push(metadata);
      } catch (error) {
        console.error(`Error minting token #${i}:`, error.message);
        break;
      }
    }
    
    // Save results to a file
    const outputDir = path.join(__dirname, '..', 'exerpts', 'runs');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputFile = path.join(outputDir, `${run_id}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(tokenURIs, null, 2));
    
    console.log(`Generated ${tokenURIs.length} tokens. Output saved to ${outputFile}`);
    expect(tokenURIs.length).to.be.greaterThan(0);
  });
});