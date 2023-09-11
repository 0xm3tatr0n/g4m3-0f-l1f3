const { ethers } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const file_uuid = require('../scripts/customTestfileName');

// for extracting files
const path = require('path');
const fs = require('fs');

const BN = require('bn.js');

// Enable and inject BN dependency
use(require('chai-bn')(BN));

use(solidity);

// check for --data flag to make extracting data conditional
const data = process.env.DATA;

// generate an ID for this test run to be used for filenames of extracted data, gas

function decodeTokenURI(tokenURI64) {
  // parse base64 tokenURI for later consumption
  const jsonManifestString = atob(tokenURI64.substring(29));
  // console.log('json unparsed');
  // console.log(jsonManifestString);
  const jsonManifest = JSON.parse(jsonManifestString);
  return jsonManifest;
}

function extractTokenDescriptionData(tokenMetadata) {
  // get generation data
  const epochAttribute = tokenMetadata.attributes.find((e) => {
    return e.trait_type === 'epoch';
  });

  const generationAttribute = tokenMetadata.attributes.find((e) => {
    return e.trait_type === 'generation';
  });

  const epochValue = epochAttribute.value.replace('#', '');
  const generationValue = generationAttribute.value;

  return `${epochValue}/${generationValue}`;
}

function generateArray(N, min = 1, max = 100) {
  // generate arraay of N random integers between min & max
  const diff = max - min;
  const sample = Array.from({ length: N }, () => Math.floor(Math.random() * diff) + min);

  return sample;
}

describe('g4m3 base', function () {
  let G0l;
  let myContract;

  async function deployContract() {
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
  }

  describe('g4m3 0f l1f3 minting', function () {
    it('Should deploy g4m3 contract', async function () {
      await deployContract();
    });

    it('Should actually mint an item', async function () {
      const [owner] = await ethers.getSigners();
      await deployContract();
      const mintTx = await myContract.mintItem(owner.address, {
        value: ethers.utils.parseEther('0.01'),
      });
      const mintRc = await mintTx.wait();
      const mintEv = mintRc.events.find((e) => e.event === 'Transfer');
      // const [from, to, id] = mintEv.args
      // const tokenUri = await myContract.tokenURI(id.toString())
    });

    it('Should mint another item', async function () {
      const [owner] = await ethers.getSigners();
      await deployContract();
      const mintTx = await myContract.mintItem(owner.address, {
        value: ethers.utils.parseEther('0.01'),
      });
      const mintRc = await mintTx.wait();
      const mintEv = mintRc.events.find((e) => e.event === 'Transfer');
    });

    it('Should mint many', async function () {
      const [owner] = await ethers.getSigners();
      await deployContract();
      const mintTx = await myContract.mintPack(owner.address, {
        value: ethers.utils.parseEther((0.025).toString()),
      });
      const mintRc = await mintTx.wait();
      const mintEv = mintRc.events.find((e) => e.event === 'Transfer');

      // get user's token balance
      const userTokenBalance = await myContract.balanceOf(owner.address);
      // console.log('user token balance: ', userTokenBalance.toString())

      // get user's token IDs
      const ownedTokens = [];
      for (let i = 0; i < userTokenBalance; i++) {
        const tokenId = await myContract.tokenOfOwnerByIndex(owner.address, i);
        ownedTokens.push(tokenId.toString());
      }
    });

    // it('Should pause minting & let mint attempts fail', async function () {
    //   const [owner, addr1, addr2] = await ethers.getSigners();
    //   await deployContract();
    //   const pauseTx = await myContract.pause();

    //   await expect(
    //     myContract
    //       .connect(addr1)
    //       .mintItem(addr1.address, { value: ethers.utils.parseEther((0.01).toString()) })
    //   ).to.be.revertedWith('Pausable: paused');
    // });

    it('Should mint a few & withdraw funds', async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await deployContract();
      const mintTx = await myContract.mintPack(owner.address, {
        value: ethers.utils.parseEther((0.025).toString()),
      });
      const mintRc = await mintTx.wait();
      const mintEv = mintRc.events.find((e) => e.event === 'Transfer');

      // testing withdrawals

      // withdraw as not owner: expected to fail
      await expect(myContract.connect(addr1).drainFunds()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );

      // withdraw as owner: should succeed
      await expect(myContract.drainFunds());
    });

    it('Should mint for free', async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await deployContract();
      // move 10 days into the future
      await helpers.time.increase(60 * 60 * 24 * 10);

      await expect(myContract.mintForFree(owner.address, 20)).to.be.revertedWith('no free mints');
      await expect(myContract.mintForFree(owner.address, 10));
    });

    // it('Should keep minting until generation changes', async function () {
    //   const [owner] = await ethers.getSigners();
    //   await deployContract();

    //   let lastGeneration = '#1';
    //   let nextGeneration = '#1';
    //   let latestToken = '';

    //   while (lastGeneration === nextGeneration) {
    //     const mintTx = await myContract.mintPack(owner.address, {
    //       value: ethers.utils.parseEther((0.025).toString()),
    //     });
    //     const mintRc = await mintTx.wait();
    //     const mintEv = mintRc.events.find((e) => e.event === 'Transfer');

    //     // get user's token balance
    //     const userTokenBalance = await myContract.balanceOf(owner.address);
    //     // identify last minted token
    //     const tokenId = await myContract.tokenOfOwnerByIndex(owner.address, userTokenBalance - 1);
    //     // console.log('last token id: ', tokenId.toString())
    //     latestToken = tokenId.toString();
    //     const tokenURI = await myContract.tokenURI(tokenId);
    //     const tokenMetadata = decodeTokenURI(tokenURI);

    //     // console.log('token metadata:');
    //     // console.log(tokenMetadata);

    //     // get generation data
    //     const generationAttribute = tokenMetadata.attributes.find((e) => {
    //       return e.trait_type === 'epoch';
    //     });

    //     const generationValue = generationAttribute.value;
    //     nextGeneration = generationValue;

    //     console.log(`last token checked ${latestToken} is at epoch ${generationValue}`);
    //   }

    //   // save generated data to stats (to get an idea of avg gen length)

    //   console.log(`epoch changed to ${nextGeneration} at tokenId ${latestToken}`);
    // });

    // it('Should keep minting until the end', async function () {
    //   const [owner] = await ethers.getSigners();
    //   await deployContract();

    //   let currentGeneration = 1;
    //   let finalGeneration = 11;
    //   let latestToken = '';
    //   let dataArray = [];

    //   while (currentGeneration <= finalGeneration) {
    //     try {
    //       const mintTx = await myContract.mintItem(owner.address, {
    //         value: ethers.utils.parseEther((0.01).toString()),
    //       });
    //       await mintTx.wait();
    //       // const mintEv = mintRc.events.find((e) => e.event === 'Transfer');

    //       // get user's token balance
    //       const userTokenBalance = await myContract.balanceOf(owner.address);
    //       // identify last minted token
    //       const tokenId = await myContract.tokenOfOwnerByIndex(owner.address, userTokenBalance - 1);
    //       // console.log('last token id: ', tokenId.toString())
    //       latestToken = tokenId.toString();
    //       const tokenURI = await myContract.tokenURI(tokenId);
    //       const tokenMetadata = decodeTokenURI(tokenURI);

    //       dataArray.push(tokenMetadata);

    //       // get generation data
    //       const epochAttribute = tokenMetadata.attributes.find((e) => {
    //         return e.trait_type === 'epoch';
    //       });

    //       const generationAttribute = tokenMetadata.attributes.find((e) => {
    //         return e.trait_type === 'generation';
    //       });

    //       const generationValue = epochAttribute.value.replace('#', '');
    //       currentGeneration = generationValue;

    //       console.log(
    //         `last token checked ${latestToken} is at epoch ${generationValue} / ${generationAttribute.value}`
    //       );
    //     } catch (e) {
    //       console.log(
    //         `!!! ERROR: last token checked ${latestToken} is at epoch ${generationValue} / ${generationAttribute.value}`
    //       );
    //       fs.writeFileSync(
    //         path.resolve(__dirname, '..', 'exerpts', Date.now() + '-Summary.json'),
    //         JSON.stringify(dataArray, null, 2)
    //       );
    //     }
    //   }
    // });

    const { expect } = require('chai');

    // it('Should keep minting until the end', async function () {
    //   const [owner] = await ethers.getSigners();
    //   await deployContract();

    //   let currentGeneration = 1;
    //   let finalGeneration = 11;
    //   let latestToken = '';
    //   let dataArray = [];
    //   let mintingEnded = false;

    //   while (currentGeneration <= finalGeneration && !mintingEnded) {
    //     try {
    //       await expect(async () => {
    //         const mintTx = await myContract.mintItem(owner.address, {
    //           value: ethers.utils.parseEther((0.01).toString()),
    //         });
    //         // console.log(mintTx);
    //         await mintTx.wait();
    //       }).to.not.throw(); // Expect no error

    //       const userTokenBalance = await myContract.balanceOf(owner.address);
    //       const tokenId = await myContract.tokenOfOwnerByIndex(owner.address, userTokenBalance - 1);
    //       latestToken = tokenId.toString();
    //       const tokenURI = await myContract.tokenURI(tokenId);
    //       const tokenMetadata = decodeTokenURI(tokenURI);

    //       dataArray.push(tokenMetadata);

    //       const epochAttribute = tokenMetadata.attributes.find((e) => e.trait_type === 'epoch');
    //       const generationAttribute = tokenMetadata.attributes.find(
    //         (e) => e.trait_type === 'generation'
    //       );
    //       const generationValue = epochAttribute.value.replace('#', '');
    //       currentGeneration = generationValue;

    //       console.log(
    //         `last token checked ${latestToken} is at epoch ${generationValue} / ${generationAttribute.value}. minting ended: ${mintingEnded}`
    //       );
    //     } catch (e) {
    //       console.log('Some error happened');
    //       console.log(e);
    //       if (e.message.includes('minted out')) {
    //         mintingEnded = true;
    //       } else {
    //         console.error(e);
    //       }
    //     }

    //     if (mintingEnded) {
    //       fs.writeFileSync(
    //         path.resolve(__dirname, '..', 'exerpts', Date.now() + '-Summary.json'),
    //         JSON.stringify(dataArray, null, 2)
    //       );
    //       console.log(
    //         `Minting has ended. Last token checked ${latestToken} is at epoch ${currentGeneration}`
    //       );
    //       break;
    //     }
    //   }

    //   fs.writeFileSync(
    //     path.resolve(__dirname, '..', 'exerpts', Date.now() + '-Summary.json'),
    //     JSON.stringify(dataArray, null, 2)
    //   );
    // });

    if (data) {
      it('Should mint all tokens and aggregate tokenURI data', async function () {
        const [owner] = await ethers.getSigners();
        await deployContract();

        const tokenURIs = [];
        let minting = true;
        let i = 1;

        while (minting) {
          // console.log(`minting token:  ${i}`);
          try {
            const mintTx = await myContract.mintItem(owner.address, {
              value: ethers.utils.parseEther((0.01).toString()),
            });
            await mintTx.wait();
            const tokenURI = await myContract.tokenURI(i);
            const tokenMetaData = decodeTokenURI(tokenURI);
            const tokenAttributes = extractTokenDescriptionData(tokenMetaData);
            tokenURIs.push(tokenMetaData);
            console.log(`${i}:${tokenAttributes}`);
            i++;
          } catch (error) {
            console.log('minting error: ', error);
            if (error.message.includes('minted out')) {
              console.log('minting ended');
              minting = false;
            } else {
              throw error;
            }
          }
        }

        // Write the tokenURIs array to a JSON file
        const timestamp = Date.now();
        const filePath = path.join(__dirname, '..', 'exerpts', 'runs', `${file_uuid}.json`);
        fs.writeFileSync(filePath, JSON.stringify(tokenURIs, null, 2));

        console.log(`Token URIs written to ${filePath}`);
      });
    }

    it('Should assert that tokenURI is not longer than 12k chars', async function () {
      const [owner] = await ethers.getSigners();
      await deployContract();

      // mint a sample of 50 tokens
      for (let i = 0; i < 10; i++) {
        const mintTx = await myContract.mintPack(owner.address, {
          value: ethers.utils.parseEther((0.025).toString()),
        });
        const mintRc = await mintTx.wait();
        const mintEv = mintRc.events.find((e) => e.event === 'Transfer');
      }

      // check token balance
      const userTokenBalance = await myContract.balanceOf(owner.address);

      // select some random tokens out of the 100 minted
      const sample = generateArray(10, 1, userTokenBalance);

      const URIs = await Promise.all(
        sample.map(async (s) => {
          const tokenURIraw = await myContract.tokenURI(s.toString());
          const tokenURI = decodeTokenURI(tokenURIraw);
          return tokenURI;
        })
      );

      const URIstats = URIs.map((e) => {
        const uriLength = e.image.length;
        return uriLength;
      });

      const maxLength = Math.max.apply(Math, URIstats);
      const avgLength =
        URIstats.reduce((a, b) => {
          return a + b;
        }) / URIstats.length;
      console.log('Max URI length ', maxLength, 'avg length: ', avgLength);

      await expect(Number(maxLength)).to.be.lessThan(12000);
    });

    // it('Should render a grid 8x8', async function () {
    //   // function showStateInt() deprecated
    //   const [owner] = await ethers.getSigners();
    //   await deployContract();
    //   const gameState = await myContract.showStateInt();
    //   // const gameGridRender = await myContract.renderGameGrid(gameState)
    //   // expect(gameState).to.be.an('array').with.length(8)
    //   // todo: better test here..
    // });
  });
});
