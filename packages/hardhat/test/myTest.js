const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

const BN = require('bn.js');

// Enable and inject BN dependency
use(require('chai-bn')(BN));

use(solidity);

describe("My Dapp", function () {
  let myContract;

  async function deployContract(){
    const YourContract = await ethers.getContractFactory("YourCollectible");

    myContract = await YourContract.deploy();

  }

  describe("YourContract", function () {
    it("Should deploy YourContract", async function () {
      await deployContract()
    });

    it("Should initialize a mock state", async function () {

      const mockState = await myContract.mockState()
      expect(mockState).to.be.a.bignumber

    });

    it("Should initialize a game state", async function () {

      const gameState = await myContract.checkState()
      expect(gameState).to.be.an('array').with.length(32)

    });

  });

});
