/* eslint no-use-before-define: "warn" */
const fs = require('fs');
const chalk = require('chalk');
const { config, tenderly, run, network } = require('hardhat');
const { ethers } = require('hardhat');
// const { JsonRpcProvider } = require('ethers/providers');
// const { ethers } = require('ethers');
const R = require('ramda');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
require('@nomiclabs/hardhat-etherscan');
// require('@nomiclabs/hardhat-ethers');

// ledger signer
// const { getLedgerSigner } = require('./ledgerSigner');
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid-noevents');
const { default: LedgerEth } = require('@ledgerhq/hw-app-eth');
// const { ethers } = require('ethers');

const main = async () => {
  console.log(`\n\n 📡 Deploying to ${network.name}...\n`);

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

    G0lLib = await deploy('G0l');
    BitOpsLib = await deploy('BitOps');

    yourCollectible = await deploy(
      'G4m3',
      [],
      {},
      {
        G0l: G0lLib.address,
        BitOps: BitOpsLib.address,
      }
    );

    // mint a bunch at deploy time to have a collection right away
    const MINTS_10 = 10; // how many times to mintMany, max 10 per transaction
    for (let i = 0; i < MINTS_10; i++) {
      const minted = await yourCollectible.mintPack('0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295', {
        value: ethers.utils.parseEther((0.025).toString()),
      });
      await minted.wait(1);
      console.log(minted);
    }
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

    G0lLib = await deployLedger('G0l');
    await G0lLib.deployTransaction.wait(6);
    BitOpsLib = await deployLedger('BitOps');
    await BitOpsLib.deployTransaction.wait(6);

    yourCollectible = await deployLedger(
      'G4m3',
      [],
      {},
      {
        G0l: G0lLib.address,
        BitOps: BitOpsLib.address,
      }
    );

    // wait for a bit
    await yourCollectible.deployTransaction.wait(10);

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

  await yourCollectible.transferOwnership('0x5B310560815EaF364E5876908574b4a9c6eC1B7e');

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

const deploy = async (contractName, _args = [], overrides = {}, libraries = {}) => {
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
    extraGasInfo = `${utils.formatEther(gasUsed)} ETH, tx hash ${deployed.deployTransaction.hash}`;
  }

  console.log(' 📄', chalk.cyan(contractName), 'deployed to:', chalk.magenta(deployed.address));
  console.log(' ⛽', chalk.grey(extraGasInfo));

  // console.log("funding address 0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295", 100 )
  // await helpers.setBalance("0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295", 10000000000);

  await tenderly.persistArtifacts({
    name: contractName,
    address: deployed.address,
  });

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};

async function deployLedger() {
  const transport = await TransportNodeHid.default.create();
  const eth = new LedgerEth(transport);
  const derivationPath = "m/44'/60'/0'/0/0";
  const result = await eth.getAddress(derivationPath);

  async function getLedgerSigner(provider) {
    const signer = provider.getSigner(result.address);
    signer._signTypedData = signer.signTypedData;
    signer.signTypedData = async function (domain, types, value) {
      const typedData = JSON.stringify({
        domain,
        types,
        value,
      });
      const signature = await eth.signEIP712TypedData(derivationPath, typedData);
      return `0x${signature}`;
    };

    signer.signMessage = async function (message) {
      const messageHash = ethers.utils.arrayify(ethers.utils.id(message));
      const messageHashHex = ethers.utils.hexlify(messageHash).substring(2);
      const rawSignature = await eth.signPersonalMessage(derivationPath, messageHashHex);
      const v = rawSignature.v;

      const signature = `0x${rawSignature.r}${rawSignature.s}${v.toString(16)}`;
      return signature;
    };

    return signer;
  }

  // const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
  // console.log(ethers);
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
  const signer = await getLedgerSigner(provider);
  const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, signer);
  const contract = await contractFactory.deploy();

  console.log('Deployed contract address:', contract.address);
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
  const encoded = utils.defaultAbiCoder.encode(deployed.interface.deploy.inputs, contractArgs);
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
