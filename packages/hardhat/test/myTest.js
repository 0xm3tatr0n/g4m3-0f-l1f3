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

    it("Should actually mint an item", async function(){
      const [owner] = await ethers.getSigners()
      await deployContract()
      const mintTx = await myContract.mintItem(owner.address, { value: ethers.utils.parseEther("0.01") });
      const mintRc = await mintTx.wait()
      const mintEv = mintRc.events.find(e => e.event === "Transfer")
      const [from, to, id] = mintEv.args
      const tokenUri = await myContract.tokenURI(id.toString())
    })

    it("Should render a grid 8x8", async function () {
      const [owner] = await ethers.getSigners()
      await deployContract()
      const gameState = await myContract.showState()
      const gameGridRender = await myContract.renderGameGrid(gameState)
      expect(gameState).to.be.an('array').with.length(8)

    });
  });

});
