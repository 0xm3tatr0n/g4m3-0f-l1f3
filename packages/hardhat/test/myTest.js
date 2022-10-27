const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

const BN = require('bn.js');

// Enable and inject BN dependency
use(require('chai-bn')(BN));

use(solidity);

describe("My Dapp", function () {
  const gridDimensions = 8;
  let myContract;

  async function deployContract(){
    const YourContract = await ethers.getContractFactory("YourCollectible");

    myContract = await YourContract.deploy();

  }

  describe("YourContract", function () {
    it("Should deploy YourContract", async function () {
      await deployContract()
    });

    it("Should initialize a game state", async function () {

      const gameState = await myContract.checkState()
      expect(gameState).to.be.an('array').with.length(gridDimensions)

    });

    it("Should render a grid", async function () {

      const gameState = await myContract.checkState()
      const gameGridRender = await myContract.renderGameGrid(gameState)
      // console.log(gameGridRender)
      
      // expect(gameState).to.be.an('array').with.length(32)

    });

    // it("Should return a complete SVG", async function () {

    //   // const gameState = await myContract.checkState()
    //   // const gameGridRender = await myContract.renderGameGrid(gameState)
    //   // console.log(gameGridRender)
      
    //   // expect(gameState).to.be.an('array').with.length(32)

    // });

  });

});
