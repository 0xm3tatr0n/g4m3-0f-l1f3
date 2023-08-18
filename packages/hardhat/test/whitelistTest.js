const { ethers } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

const terraformsABI = require('../externalABIs/terraformsABI');

// for extracting files
const path = require('path');
const fs = require('fs');

const BN = require('bn.js');

// Enable and inject BN dependency
use(require('chai-bn')(BN));

use(solidity);

describe('g4m3 whitelist', function () {
  let G0l;
  let myContract;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const G0lLib = await ethers.getContractFactory('G0l');
    G0l = await G0lLib.deploy();

    const BitOpsLib = await ethers.getContractFactory('BitOps');
    BitOps = await BitOpsLib.deploy();

    const YourContract = await ethers.getContractFactory('G4m3', {
      libraries: {
        G0l: G0l.address,
        BitOps: BitOps.address,
      },
    });
    myContract = await YourContract.deploy();
  });

  it('Should fail to mint from a non-whitelisted address', async function () {
    await expect(myContract.connect(addr1).mintFreeGated()).to.be.revertedWith(
      'Not eligible for free mint'
    );
  });

  it('Should add a given address to the whitelist and allow minting from that address', async function () {
    // Add addr1 to the whitelist
    const addTx = await myContract.addToWhitelist(addr1.address);
    await addTx.wait();

    // Mint from addr1 after adding to the whitelist, expecting it to succeed
    await expect(myContract.connect(addr1).mintFreeGated()).to.not.be.reverted; // Add necessary arguments if mintItem requires any
  });

  it('Should test ownership of an NFT in a given collection', async function () {
    // Address that owns an NFT in the collection
    const ownerAddress = '0x5B310560815EaF364E5876908574b4a9c6eC1B7e';

    // Impersonate the owner's address
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ownerAddress],
    });

    // Connect to the owner's address
    const owner = await ethers.provider.getSigner(ownerAddress);

    // Address of the external collection contract
    const contractAddress = '0x4E1f41613c9084FdB9E34E11fAE9412427480e56';

    // ABI of the external collection contract (replace with the actual ABI)
    const contractABI = terraformsABI;

    // Connect to the external collection contract
    const contract = new ethers.Contract(contractAddress, contractABI, owner);

    // Perform tests as the owner
    const ownerBalance = await contract.balanceOf(ownerAddress);

    // Check that the owner of the token is the expected address
    expect(ownerBalance).to.be.gt(0);

    // Additional tests and assertions as needed
  });

  it('Should test whitelisting through ownership of other collections', async function () {
    // Address that owns an NFT in the collection
    const terraformsOwnerAddress = '0x5B310560815EaF364E5876908574b4a9c6eC1B7e';

    // Impersonate the owner's address
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [terraformsOwnerAddress],
    });

    // Connect to the owner's address
    const [owner, addr1, addr2] = await ethers.getSigners();
    const terraformsOwner = await ethers.provider.getSigner(terraformsOwnerAddress);

    // Address of the external collection contract
    const contractAddress = '0x4E1f41613c9084FdB9E34E11fAE9412427480e56';

    // ABI of the external collection contract (replace with the actual ABI)
    const contractABI = terraformsABI;

    // Connect to the external collection contract
    const contract = new ethers.Contract(contractAddress, contractABI, terraformsOwner);

    // Perform tests as the owner
    const ownerBalance = await contract.balanceOf(terraformsOwnerAddress);

    // Check that the owner of the token is the expected address
    expect(ownerBalance).to.be.gt(0);

    // Connect to your contract as the original owner (from beforeEach)
    const myContractWithOwner = myContract.connect(owner);

    // Add the external collection to the whitelist
    const addTx = await myContractWithOwner.addNftCollection(contractAddress);
    await addTx.wait();

    // Test mintFreeGated with the impersonated address (should succeed)
    await expect(myContract.connect(terraformsOwner).mintFreeGated()).to.not.be.reverted;

    // Test mintFreeGated with addr1 (should revert)
    await expect(myContract.connect(addr1).mintFreeGated()).to.be.revertedWith(
      'Not eligible for free mint'
    ); // Adjust the revert message accordingly

    // Additional tests and assertions as needed
  });
});
