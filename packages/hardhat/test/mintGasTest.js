const { ethers, network } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const fs = require('fs');
const path = require('path');

use(solidity);

/**
 * Comprehensive gas test for the G4m3 contract mint functions
 * This test measures gas usage for different minting scenarios:
 * - Single mint (first mint vs subsequent mints)
 * - Batch minting (5 tokens at once)
 * - Owner free minting
 * - Free gated minting
 * - Minting across epoch transitions
 */
describe('G4m3 Mint Gas Tests', function () {
  // Set a longer timeout
  this.timeout(120000);

  let g4m3;
  let bitOps;
  let g0l;
  let owner;
  let user1;
  let user2;
  let testResults = {
    timestamp: new Date().toISOString(),
    mintOperations: []
  };
  
  // Function to add a gas test result
  function recordGasUsage(operation, description, gasUsed, txHash) {
    testResults.mintOperations.push({
      operation,
      description,
      gasUsed: gasUsed.toString(),
      txHash
    });
    console.log(`Gas used for ${operation} (${description}): ${gasUsed.toString()} gas units`);
  }

  async function deployContract() {
    // Deploy libraries first
    const BitOpsFactory = await ethers.getContractFactory('BitOps');
    bitOps = await BitOpsFactory.deploy();
    await bitOps.deployed();
    
    const G0lFactory = await ethers.getContractFactory('G0l');
    g0l = await G0lFactory.deploy();
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
    
    return g4m3;
  }

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
  });

  describe('Gas costs for mint operations', function () {
    
    beforeEach(async function () {
      // Deploy a fresh contract for each test
      await deployContract();
      
      // Fast forward time to enable public minting
      await network.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
      await network.provider.send('evm_mine');
    });
    
    it('Should measure gas for first token mint', async function () {
      // First mint should create a new epoch and initial state
      const tx = await g4m3.mintItem(owner.address, {
        value: ethers.utils.parseEther('0.02')
      });
      const receipt = await tx.wait();
      
      recordGasUsage('mintItem', 'First token (new epoch/generation)', receipt.gasUsed, receipt.transactionHash);
    });
    
    it('Should measure gas for subsequent token mints', async function () {
      // First mint the initial token
      await g4m3.mintItem(owner.address, {
        value: ethers.utils.parseEther('0.02')
      });
      
      // Now measure the gas for a second mint (same epoch, next generation)
      const tx = await g4m3.mintItem(owner.address, {
        value: ethers.utils.parseEther('0.02')
      });
      const receipt = await tx.wait();
      
      recordGasUsage('mintItem', 'Second token (same epoch, next generation)', receipt.gasUsed, receipt.transactionHash);
      
      // Mint a few more to see if gas changes with generation
      await g4m3.mintItem(owner.address, {
        value: ethers.utils.parseEther('0.02')
      });
      
      // Measure the fourth mint
      const tx2 = await g4m3.mintItem(owner.address, {
        value: ethers.utils.parseEther('0.02')
      });
      const receipt2 = await tx2.wait();
      
      recordGasUsage('mintItem', 'Fourth token (higher generation)', receipt2.gasUsed, receipt2.transactionHash);
    });
    
    it('Should measure gas for pack minting (5 tokens)', async function () {
      const tx = await g4m3.mintPack(owner.address, {
        value: ethers.utils.parseEther('0.05')
      });
      const receipt = await tx.wait();
      
      recordGasUsage('mintPack', '5 tokens at once', receipt.gasUsed, receipt.transactionHash);
      
      // Calculate average gas per token in the pack
      const gasPerToken = receipt.gasUsed.div(5);
      recordGasUsage('mintPack', 'Average per token in pack', gasPerToken, receipt.transactionHash);
    });
    
    it('Should measure gas for owner free minting', async function () {
      const tx = await g4m3.mintFreeOwner(1);
      const receipt = await tx.wait();
      
      recordGasUsage('mintFreeOwner', 'Single token', receipt.gasUsed, receipt.transactionHash);
      
      // Now try minting multiple tokens
      const tx2 = await g4m3.mintFreeOwner(3);
      const receipt2 = await tx2.wait();
      
      recordGasUsage('mintFreeOwner', '3 tokens at once', receipt2.gasUsed, receipt2.transactionHash);
      
      // Calculate average gas per token
      const gasPerToken = receipt2.gasUsed.div(3);
      recordGasUsage('mintFreeOwner', 'Average per token in batch', gasPerToken, receipt2.transactionHash);
    });
    
    it('Should measure gas for whitelist free minting', async function () {
      // First add user to whitelist
      await g4m3.addUserToWhitelist(user1.address);
      
      // Now mint as whitelisted user
      const tx = await g4m3.connect(user1).mintFreeGated(1);
      const receipt = await tx.wait();
      
      recordGasUsage('mintFreeGated', 'Single token (whitelisted)', receipt.gasUsed, receipt.transactionHash);
      
      // Try minting multiple tokens
      const tx2 = await g4m3.connect(user1).mintFreeGated(3);
      const receipt2 = await tx2.wait();
      
      recordGasUsage('mintFreeGated', '3 tokens at once (whitelisted)', receipt2.gasUsed, receipt2.transactionHash);
      
      // Calculate average gas per token
      const gasPerToken = receipt2.gasUsed.div(3);
      recordGasUsage('mintFreeGated', 'Average per token in batch (whitelisted)', gasPerToken, receipt2.transactionHash);
    });
    
    it('Should measure gas costs across epoch transitions', async function () {
      // We'll mint enough tokens to force an epoch transition
      // This will likely happen after many mints, but for testing we'll 
      // mint tokens in a loop until we detect an epoch change
      
      console.log('Minting tokens until epoch transition (this may take a while)...');
      
      let currentEpoch = 1;
      let tokensMinted = 0;
      let lastGasUsed;
      let transitionGasUsed;
      
      // Mint until we see an epoch transition or hit a reasonable limit
      while (tokensMinted < 50) {
        const tx = await g4m3.mintItem(owner.address, {
          value: ethers.utils.parseEther('0.02')
        });
        const receipt = await tx.wait();
        tokensMinted++;
        lastGasUsed = receipt.gasUsed;
        
        // Check current epoch by reading the token URI of the last minted token
        const tokenURI = await g4m3.tokenURI(tokensMinted);
        const base64 = tokenURI.split('base64,')[1];
        const jsonString = Buffer.from(base64, 'base64').toString();
        const metadata = JSON.parse(jsonString);
        
        const epochAttr = metadata.attributes.find(a => a.trait_type === 'epoch');
        const epochNumber = parseInt(epochAttr.value.replace('#', ''));
        
        if (epochNumber > currentEpoch) {
          // We've hit an epoch transition
          console.log(`Epoch transition detected at token #${tokensMinted}`);
          transitionGasUsed = lastGasUsed;
          break;
        }
      }
      
      if (transitionGasUsed) {
        recordGasUsage('mintItem', 'Mint causing epoch transition', transitionGasUsed, 'N/A');
      } else {
        console.log('No epoch transition detected within the testing limit');
      }
    });
  });
  
  after(async function() {
    // Save test results to a file
    const resultsDir = path.join(__dirname, '..', 'exerpts', 'gas-reports');
    fs.mkdirSync(resultsDir, { recursive: true });
    
    const resultsFile = path.join(resultsDir, `mint-gas-report-${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    
    console.log(`\nGas test results saved to: ${resultsFile}`);
    
    // Create a summary table for console output
    console.log('\n======= MINT GAS USAGE SUMMARY =======');
    console.log('Operation                           | Gas Units');
    console.log('------------------------------------|-----------');
    
    testResults.mintOperations.forEach(op => {
      const paddedOp = (op.operation + ' (' + op.description + ')').padEnd(36);
      console.log(`${paddedOp} | ${op.gasUsed}`);
    });
    
    // Add explanation about gas units vs. costs
    console.log('======================================');
    console.log('NOTE: Gas units represent computational complexity.');
    console.log('Actual ETH cost = gas units × gas price (set by the network).');
    console.log('At 20 gwei gas price: 100,000 gas units = 0.002 ETH');
    console.log('======================================\n');
  });
});