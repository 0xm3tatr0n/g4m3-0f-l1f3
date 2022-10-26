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
      // const newPurpose = "Test Purpose";

      // await myContract.setPurpose(newPurpose);
      // expect(await myContract.purpose()).to.equal(newPurpose);
      const mockState = await myContract.mockState()

      expect(mockState).to.be.a.bignumber

    });

  });

});
