const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const BN = require('bn.js');

// Enable and inject BN dependency
use(require('chai-bn')(BN));

use(solidity);

function decodeTokenURI(tokenURI64){
  // parse base64 tokenURI for later consumption
  const jsonManifestString = atob(tokenURI64.substring(29))
  const jsonManifest = JSON.parse(jsonManifestString)
  return jsonManifest

}

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
      // const [from, to, id] = mintEv.args
      // const tokenUri = await myContract.tokenURI(id.toString())
    })

    it("Should mint another item", async function(){
      const [owner] = await ethers.getSigners()
      await deployContract()
      const mintTx = await myContract.mintItem(owner.address, { value: ethers.utils.parseEther("0.01") });
      const mintRc = await mintTx.wait()
      const mintEv = mintRc.events.find(e => e.event === "Transfer")
    })

    it("Should mint many", async function(){
      const [owner] = await ethers.getSigners()
      await deployContract()
      const mintTx = await myContract.mintMany(owner.address, 10 , { value: ethers.utils.parseEther((0.01 * 10).toString()) });
      const mintRc = await mintTx.wait()
      const mintEv = mintRc.events.find(e => e.event === "Transfer")
      
      // get user's token balance
      const userTokenBalance = await myContract.balanceOf(owner.address)
      // console.log('user token balance: ', userTokenBalance.toString())

      // get user's token IDs
      const ownedTokens = []
      for (let i = 0; i < userTokenBalance; i++){
        const tokenId = await myContract.tokenOfOwnerByIndex(owner.address, i)
        ownedTokens.push(tokenId.toString())
      }
    })

    it("Should pause minting & let mint attempts fail", async function(){
      const [ owner, addr1, addr2 ] = await ethers.getSigners()
      await deployContract()
      const pauseTx = await myContract.pause();

      await expect(myContract.connect(addr1).mintItem(addr1.address, { value: ethers.utils.parseEther((0.01).toString())})).to.be.revertedWith('Pausable: paused')
    })

    it("Should mint a few & withdraw funds", async function(){
      const [ owner, addr1, addr2 ] = await ethers.getSigners()
      await deployContract()
      const mintTx = await myContract.mintMany(owner.address, 10 , { value: ethers.utils.parseEther((0.01 * 10).toString()) });
      const mintRc = await mintTx.wait()
      const mintEv = mintRc.events.find(e => e.event === "Transfer")

      // testing withdrawals
      const amount = ethers.utils.parseEther((0.01 * 10).toString());

      // withdraw as not owner: expected to fail
      await expect(myContract.connect(addr1).withdrawAmount(amount)).to.be.revertedWith("Ownable: caller is not the owner");

      // withdraw as owner: should succeed
      await expect(myContract.withdrawAmount(amount));

    })

    it("Should mint for free", async function(){
      const [ owner, addr1, addr2 ] = await ethers.getSigners()
      await deployContract()
      // move 10 days into the future
      await helpers.time.increase(60*60*24*10)

      await expect(myContract.mintForFree(owner.address, 20)).to.be.revertedWith("not enough free mints")
      await expect(myContract.mintForFree(owner.address, 10))

    })

    it("Should keep minting until generation changes", async function(){
      const [owner] = await ethers.getSigners()
      await deployContract()

      let lastGeneration = "#1"
      let nextGeneration = "#1"
      let latestToken = ""

      while (lastGeneration === nextGeneration){
        const mintTx = await myContract.mintMany(owner.address, 10 , { value: ethers.utils.parseEther((0.01 * 10).toString()) });
        const mintRc = await mintTx.wait()
        const mintEv = mintRc.events.find(e => e.event === "Transfer")
        
        // get user's token balance
        const userTokenBalance = await myContract.balanceOf(owner.address);
        // identify last minted token
        const tokenId = await myContract.tokenOfOwnerByIndex(owner.address, userTokenBalance - 1)
        // console.log('last token id: ', tokenId.toString())
        latestToken = tokenId.toString()
        const tokenURI = await myContract.tokenURI(tokenId)
        const tokenMetadata = decodeTokenURI(tokenURI)

        // get generation data
        const generationAttribute = tokenMetadata.attributes.find((e) => {
          return e.trait_type === 'generation'
        })

        const generationValue = generationAttribute.value
        nextGeneration = generationValue

        console.log(`last token checked ${latestToken} is at generation ${generationValue}`)
      
      }

      console.log(`generation changed to ${nextGeneration} at tokenId ${latestToken}`)

    })

    it("Should render a grid 8x8", async function () {
      const [owner] = await ethers.getSigners()
      await deployContract()
      const gameState = await myContract.showStateInt()
      // const gameGridRender = await myContract.renderGameGrid(gameState)
      // expect(gameState).to.be.an('array').with.length(8)
      // todo: better test here..
    });
  });

});
