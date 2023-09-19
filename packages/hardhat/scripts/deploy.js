/* eslint no-use-before-define: "warn" */
const fs = require('fs');
const chalk = require('chalk');
const { LedgerSigner } = require('@anders-t/ethers-ledger');
const { config, tenderly, run, network } = require('hardhat');
const { ethers } = require('hardhat');
const R = require('ramda');
const Web3 = require('web3');
require('@nomiclabs/hardhat-etherscan');

// trying to use frame
const ethProvider = require('eth-provider'); // eth-provider is a simple EIP-1193 provider
// todo: probably better to read from hardhat.config.js

// const web3 = new Web3(frame);

const main = async () => {
  console.log(`\n\n 📡 Deploying to ${network.name} (${network.config.chainId})...\n`);

  // common variables
  let G0lLib, BitOpsLib, yourCollectible;

  if (network.name == 'localhost') {
    // deploy to localhost/hardhat
    // libraries first, no need to wait

    // //If you want to send value to an address from the deployer
    const deployerWallet = ethers.provider.getSigner();
    await deployerWallet.sendTransaction({
      to: '0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295',
      value: ethers.utils.parseEther('10'),
    });

    await deployerWallet.sendTransaction({
      to: '0x5641b67F2637d7c605eae9fAee8E83D7EA1B3fb9',
      value: ethers.utils.parseEther('10'),
    });

    await deployerWallet.sendTransaction({
      to: '0x5B310560815EaF364E5876908574b4a9c6eC1B7e',
      value: ethers.utils.parseEther('10'),
    });

    G0lLib = await deployLocal('G0l');
    BitOpsLib = await deployLocal('BitOps');

    yourCollectible = await deployLocal(
      'G4m3',
      [],
      {},
      {
        G0l: G0lLib.address,
        BitOps: BitOpsLib.address,
      }
    );

    // mint a bunch at deploy time to have a collection right away
    const MINTS_10 = 3; // how many times to mintMany, max 10 per transaction
    for (let i = 0; i < MINTS_10; i++) {
      const minted = await yourCollectible.mintPack('0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295', {
        value: ethers.utils.parseEther((0.025).toString()),
      });
      await minted.wait(1);
      console.log(`minted pack no ${i}`);
      console.log(minted);
    }

    // add address to whitelist to test free mint (should not be affected by previous mints as they're not free)
    await yourCollectible
      .connect(deployerWallet)
      .addToWhitelist('0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295');
  } else {
    // deploy to other environment
    // new script for deploying with ledger (not using deploy function...)
    // const provider = hre.ethers.provider;
    // const signer = await getLedgerSigner(provider);
    // console.log('Deploying contracts with the account:', await signer.getAddress());

    // G0lLib = await hre.ethers.getContractFactory('G0l', signer);
    // g0llib = await G0lLib.deploy();
    // await g0llib.deployed();
    // console.log('Contract deployed to:', g0llib.address);
    // // await g0llib.deployTransaction.wait(6);
    // BitOpsLib = await hre.ethers.getContractFactory('BitOps', signer);
    // bitopslib = await BitOpsLib.deploy();
    // await bitopslib.deployed();
    // console.log('Contract deployed to:', bitopslib.address);
    // // bitopslib.deployTransaction.wait(6)

    // yourCollectible = await hre.ethers.getContractFactory('G4m3', {
    //   libraries: {
    //     G0l: G0lLib.address,
    //     BitOps: BitOpsLib.address,
    //   },
    //   signer,
    // });

    G0lLib = await deployLedgerFrame('G0l');
    // await G0lLib.deployTransaction.wait(6);
    console.log('>>>> G0l deployed!');
    BitOpsLib = await deployLedgerFrame('BitOps');
    // await BitOpsLib.deployTransaction.wait(6);
    console.log('>>>> BitOps deployed!');

    yourCollectible = await deployLedgerFrame(
      'G4m3',
      [],
      {},
      {
        G0l: G0lLib.address,
        BitOps: BitOpsLib.address,
      }
    );

    // wait for a bit
    // await yourCollectible.deployTransaction.wait(10);
    console.log('>>>> G4m3 deployed!');

    console.log(chalk.blue('verifying on etherscan'));
    await run('verify:verify', {
      address: yourCollectible.address,
      // constructorArguments: args // If your contract has constructor arguments, you can pass them as an array
    });

    // // old script (working) for deploying from local wallet
    // linking libraries
    // G0lLib = await deploy('G0l');
    // await G0lLib.deployTransaction.wait(6);
    // BitOpsLib = await deploy('BitOps');
    // await BitOpsLib.deployTransaction.wait(6);

    // yourCollectible = await deploy(
    //   'G4m3',
    //   [],
    //   {},
    //   {
    //     G0l: G0lLib.address,
    //     BitOps: BitOpsLib.address,
    //   }
    // );

    // // wait for a bit
    // await yourCollectible.deployTransaction.wait(10);

    // console.log(chalk.blue('verifying on etherscan'));
    // await run('verify:verify', {
    //   address: yourCollectible.address,
    //   // constructorArguments: args // If your contract has constructor arguments, you can pass them as an array
    // });
  }

  // await yourCollectible.transferOwnership('0x5B310560815EaF364E5876908574b4a9c6eC1B7e');

  // //If you want to send value to an address from the deployer
  // const deployerWallet = ethers.provider.getSigner();
  // await deployerWallet.sendTransaction({
  //   to: '0x5B310560815EaF364E5876908574b4a9c6eC1B7e',
  //   value: ethers.utils.parseEther('10'),
  // });

  // If you want to verify your contract on etherscan

  console.log(
    ' 💾  Artifacts (address, abi, and args) saved to: ',
    chalk.blue('packages/hardhat/artifacts/'),
    '\n\n'
  );
};

const deployLocal = async (contractName, _args = [], overrides = {}, libraries = {}) => {
  // console.log(chalk.red('deploy is running'));
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName, { libraries: libraries });
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  const encoded = abiEncodeArgs(deployed, contractArgs);
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  let extraGasInfo = '';
  if (deployed && deployed.deployTransaction) {
    const gasUsed = deployed.deployTransaction.gasLimit.mul(deployed.deployTransaction.gasPrice);
    extraGasInfo = `${ethers.utils.formatEther(gasUsed)} ETH, tx hash ${
      deployed.deployTransaction.hash
    }`;
  }

  console.log(' 📄', chalk.cyan(contractName), 'deployed to:', chalk.magenta(deployed.address));
  console.log(' ⛽', chalk.grey(extraGasInfo));

  await tenderly.persistArtifacts({
    name: contractName,
    address: deployed.address,
  });

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};

async function deployLedgerFrame(contractName, _args = [], overrides = {}, libraries = {}) {
  console.log(` 🛰  Deploying: ${contractName}`);

  const web3 = new Web3(network.config.url);
  const frame = ethProvider('frame', {
    network: network.name,
    rpcUrl: network.config.url,
  });

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName, { libraries: libraries });

  //
  const tx = await contractArtifacts.getDeployTransaction();

  tx.chainId = network.config.chainId;

  tx.from = (await frame.request({ method: 'eth_requestAccounts' }))[0];
  const response = await frame.request({ method: 'eth_sendTransaction', params: [tx] });

  // wait for some time
  console.log('>>> gonna wait');
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Wait for the transaction to be mined
  // console.log('web3.eth', web3.eth);
  const receipt = await web3.eth.getTransactionReceipt(response);
  console.log('>>> receipt: ', receipt);

  // Extract the deployed contract address from the receipt
  const deployedAddress = receipt.contractAddress;

  // Write the contract address to a file
  fs.writeFileSync(`artifacts/${contractName}.address`, deployedAddress);

  // Create the deployed contract object
  const deployedContract = contractArtifacts.attach(deployedAddress);

  // Encode the constructor arguments if necessary
  const encoded = abiEncodeArgs(deployedContract, contractArgs);

  // Persist the artifacts
  await tenderly.persistArtifacts({
    name: contractName,
    address: deployedAddress,
  });

  if (!encoded || encoded.length <= 2) return deployedContract;

  // Write the encoded constructor arguments to a file
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployedContract;
}

// ------ utils -------

// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, contractArgs) => {
  // not writing abi encoded args if this does not pass
  if (!contractArgs || !deployed || !R.hasPath(['interface', 'deploy'], deployed)) {
    return '';
  }
  const encoded = ethers.utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs
  );
  return encoded;
};

// checks if it is a Solidity file
const isSolidity = (fileName) =>
  fileName.indexOf('.sol') >= 0 && fileName.indexOf('.swp') < 0 && fileName.indexOf('.swap') < 0;

const readArgsFile = (contractName) => {
  let args = [];
  try {
    const argsFile = `./contracts/${contractName}.args`;
    if (!fs.existsSync(argsFile)) return args;
    args = JSON.parse(fs.readFileSync(argsFile));
  } catch (e) {
    console.log(e);
  }
  return args;
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// If you want to verify on https://tenderly.co/
const tenderlyVerify = async ({ contractName, contractAddress }) => {
  let tenderlyNetworks = [
    'kovan',
    'goerli',
    'mainnet',
    'rinkeby',
    'ropsten',
    'matic',
    'mumbai',
    'xDai',
    'POA',
  ];
  let targetNetwork = process.env.HARDHAT_NETWORK || config.defaultNetwork;

  if (tenderlyNetworks.includes(targetNetwork)) {
    console.log(
      chalk.blue(` 📁 Attempting tenderly verification of ${contractName} on ${targetNetwork}`)
    );

    await tenderly.persistArtifacts({
      name: contractName,
      address: contractAddress,
    });

    let verification = await tenderly.verify({
      name: contractName,
      address: contractAddress,
      network: targetNetwork,
    });

    return verification;
  } else {
    console.log(chalk.grey(` 🧐 Contract verification not supported on ${targetNetwork}`));
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
