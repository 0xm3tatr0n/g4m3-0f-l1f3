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
    console.log('contract deployed')
  }

  describe("YourContract", function () {
    it("Should deploy YourContract", async function () {
      await deployContract()
    });

    // it("Should mint an item", async function () {
    //   const [owner] = await ethers.getSigners()
    //   await deployContract()
    //   const mintResult = await myContract.mintItem(owner.address, { value: ethers.utils.parseEther("0.01") })
    //   console.log(mintResult);
    //   const tokenId = mintResult.toString()
    //   console.log(tokenId)
    //   console.log('tx result: ', mintResult)
    //   const tokenUri = await myContract.callStatic.tokenURI(tokenId)
    //   console.log('token URI ', tokenUri)
    //   // console.log('minted token id :', id)
    //   // expect(id).to.be.an('number')

    // });

    it("Should actually mint an item, really", async function(){
      const [owner] = await ethers.getSigners()
      await deployContract()
      const mintTx = await myContract.mintItem(owner.address, { value: ethers.utils.parseEther("0.01") });
      const mintRc = await mintTx.wait()
      const mintEv = mintRc.events.find(e => e.event === "Transfer")
      const [from, to, id] = mintEv.args
      console.log(from, to, id)
      const tokenUri = await myContract.tokenURI(id.toString())
      // todo: test if tokenUri is uri.
    })

    it("Should render a grid 8x8", async function () {
      const [owner] = await ethers.getSigners()
      await deployContract()
      // console.log('checking game state')
      const gameState = await myContract.showState()
      // console.log('gamestate: ')
      // console.log(gameState)
      const gameGridRender = await myContract.renderGameGrid(gameState)
      console.log(gameGridRender)
      expect(gameState).to.be.an('array').with.length(8)

    });

    // it("Should return a complete SVG", async function () {

    //   // const gameState = await myContract.checkState()
    //   // const gameGridRender = await myContract.renderGameGrid(gameState)
    //   // console.log(gameGridRender)
      
    //   // expect(gameState).to.be.an('array').with.length(32)

    // });

  });

});
