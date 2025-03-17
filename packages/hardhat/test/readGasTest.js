const { ethers, network } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

// Set higher timeout for the tests
this.timeout = 60000;

use(solidity);

describe('G4m3 Read Gas Tests', function () {
  // This test suite will run with a longer timeout
  this.timeout(3000000);

  let g4m3;
  let g4m3BeforeOpt; // Original contract for comparison
  let owner;
  let buyer;
  let mintedTokenIds = [];

  async function measureGas(contract, methodName, ...args) {
    // Create a transaction call data
    const callData = contract.interface.encodeFunctionData(methodName, args);

    // Estimate gas using provider
    const gasEstimate = await ethers.provider.estimateGas({
      to: contract.address,
      data: callData,
    });

    return gasEstimate.toNumber();
  }

  before(async function () {
    [owner, buyer] = await ethers.getSigners();

    // Deploy the libraries first
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
        G0l: g0l.address,
      },
    });
    g4m3 = await G4m3Factory.deploy();
    await g4m3.deployed();

    // Fast forward time to enable public minting
    const oneWeek = 7 * 24 * 60 * 60;
    await helpers.time.increase(oneWeek);

    // Mint 5 tokens to have data to test with
    for (let i = 0; i < 100; i++) {
      const tx = await g4m3.connect(buyer).mintItem(buyer.address, {
        value: ethers.utils.parseEther('0.02'),
      });
      await tx.wait();
      mintedTokenIds.push(i + 1); // Token IDs start at 1
    }
  });

  it('Should measure tokenURI gas usage', async function () {
    // For each token, measure tokenURI gas
    const gasUsages = [];

    for (const tokenId of mintedTokenIds) {
      const gas = await measureGas(g4m3, 'tokenURI', tokenId);
      gasUsages.push(gas);
      console.log(`TokenURI gas for token #${tokenId}: ${gas}`);
    }

    // Calculate average
    const avgGas = gasUsages.reduce((sum, gas) => sum + gas, 0) / gasUsages.length;
    console.log(`Average tokenURI gas usage: ${avgGas}`);

    // This test just reports gas, doesn't assert anything
    expect(true).to.be.true;
  });

  it('Should measure returnGameState gas usage', async function () {
    // For each token, measure returnGameState gas
    const gasUsages = [];

    for (const tokenId of mintedTokenIds) {
      const gas = await measureGas(g4m3, 'returnGameState', tokenId);
      gasUsages.push(gas);
      console.log(`returnGameState gas for token #${tokenId}: ${gas}`);
    }

    // Calculate average
    const avgGas = gasUsages.reduce((sum, gas) => sum + gas, 0) / gasUsages.length;
    console.log(`Average returnGameState gas usage: ${avgGas}`);

    // This test just reports gas, doesn't assert anything
    expect(true).to.be.true;
  });
});
