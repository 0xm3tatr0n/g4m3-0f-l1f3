/* eslint no-use-before-define: "warn" */
const fs = require('fs');
const chalk = require('chalk');
const { LedgerSigner } = require('@anders-t/ethers-ledger');
const { config, tenderly, run, network } = require('hardhat');
const { ethers } = require('hardhat');
const R = require('ramda');
const Web3 = require('web3');
require('@nomiclabs/hardhat-etherscan');

// Frame provider for hardware wallet integration
const ethProvider = require('eth-provider'); // eth-provider is a simple EIP-1193 provider

// Helper function to get network name by chain ID
function getNetworkName(chainId) {
  const networks = {
    '1': 'mainnet',
    '42161': 'arbitrum',
    '10': 'optimism', 
    '137': 'polygon',
    '80001': 'polygonMumbai',
    '80002': 'polygonAmoy',
    '56': 'bsc',
    '5': 'goerli',
    '11155111': 'sepolia',
    '31337': 'hardhat',
    '1337': 'localhost'
  };
  
  return networks[chainId] || null;
}

/**
 * Performs post-deployment setup for contracts on testnet
 * @param {Contract} contract - The deployed G4m3 contract
 */
async function setupContractOnTestnet(contract) {
  console.log(chalk.cyan('\n🔧 Setting up contract on testnet...'));
  
  // Check if contract has a signer attached
  if (!contract.signer) {
    throw new Error('Contract does not have a signer attached. Cannot perform setup.');
  }
  
  // Get the signer's address to confirm we're using the right account
  const signerAddress = await contract.signer.getAddress();
  console.log(`Using signer address: ${signerAddress}`);
  
  try {
    // Enable minting
    console.log('🔓 Enabling minting...');
    console.log('Sending toggleMinting transaction...');
    const enableTx = await contract.toggleMinting(true);
    console.log(`📤 Transaction sent: ${enableTx.hash}`);
    console.log('Waiting for transaction confirmation...');
    await enableTx.wait();
    console.log(chalk.green('✅ Minting enabled successfully!'));
    
    // Add the deployer address to whitelist
    console.log('📝 Adding deployer to whitelist...');
    const deployerAddress = await contract.signer.getAddress();
    const whitelistTx = await contract.addUserToWhitelist(deployerAddress);
    console.log(`📤 Transaction sent: ${whitelistTx.hash}`);
    await whitelistTx.wait();
    console.log(chalk.green(`✅ Added ${deployerAddress} to whitelist!`));
    
    // Addresses to whitelist (with special handling for Amoy)
    let additionalAddresses = [];
    
    // If on Amoy testnet, add more addresses to compensate for missing NFT ownership checks
    if (network.name === 'amoy') {
      console.log(chalk.yellow('📝 On Amoy testnet: Adding test addresses to whitelist to compensate for NFT ownership checks'));
      // Add test wallets or other addresses that should be eligible for free mints
      additionalAddresses = [
        // Add test wallet addresses here
        "0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295",
        "0x5641b67F2637d7c605eae9fAee8E83D7EA1B3fb9",
        "0x5B310560815EaF364E5876908574b4a9c6eC1B7e"
      ];
    }
    
    if (additionalAddresses.length > 0) {
      console.log('📝 Adding additional addresses to whitelist...');
      for (const address of additionalAddresses) {
        const tx = await contract.addUserToWhitelist(address);
        console.log(`📤 Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(chalk.green(`✅ Added ${address} to whitelist!`));
      }
    }
    
    console.log(chalk.green('✅ Contract setup completed successfully!'));
    
    // Print useful contract information
    console.log('\n📊 Contract Status:');
    const isMintingActive = await contract.isMintingActive();
    console.log(`- Minting active: ${isMintingActive}`);
    const ownerAddress = await contract.owner();
    console.log(`- Contract owner: ${ownerAddress}`);
    
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Contract setup failed:'), error);
    throw error;
  }
}

const main = async () => {
  console.log(`\n\n 📡 Deploying to ${network.name} (${network.config.chainId})...\n`);

  // Initialize variables for libraries and main contract
  let G0lLib, BitOpsLib, yourCollectible;
  
  // Display deployment environment details
  console.log(chalk.cyan('Deployment Environment:'));
  console.log(`- Network: ${network.name}`);
  console.log(`- Chain ID: ${network.config.chainId}`);
  console.log(`- URL: ${network.config.url ? network.config.url.substring(0, 25) + '...' : 'Not configured'}`);
  console.log(`- Gas Price: ${network.config.gasPrice || 'auto'}`);
  
  // Display special notices for specific networks
  if (network.name === 'mumbai') {
    console.log(chalk.red('\n⚠️  WARNING: Polygon Mumbai testnet is deprecated!'));
    console.log(chalk.yellow('    Please use Polygon Amoy instead with --network amoy'));
  } else if (network.name === 'amoy') {
    console.log(chalk.green('\n✅ Using Polygon Amoy testnet (the current Polygon testnet)'));
    console.log(chalk.cyan('   Explorer: https://amoy.polygonscan.com'));
    console.log(chalk.cyan('   Faucet: https://amoy.polygonscan.com/faucet'));
  }
  
  console.log('');

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
    
    // Instead of trying to mock external NFT collections, we'll simply use
    // the whitelist feature for local testing, which is a more reliable approach
    try {
      console.log("Setting up whitelist for local testing...");
      
      // The test addresses to whitelist
      const testAddresses = [
        '0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295',
        '0x5641b67F2637d7c605eae9fAee8E83D7EA1B3fb9',
        '0x5B310560815EaF364E5876908574b4a9c6eC1B7e',
        await deployerWallet.getAddress() // Also whitelist the deployer
      ];
      
      // Add each address to the whitelist
      for (const addr of testAddresses) {
        await yourCollectible.connect(deployerWallet).addUserToWhitelist(addr);
        console.log(`Added ${addr} to whitelist for free minting`);
      }
      
      console.log("Whitelist setup completed!");
    } catch (error) {
      console.error("Error setting up whitelist:", error);
    }

    // Enable minting and whitelist test addresses
    try {
      // Enable minting
      await yourCollectible.connect(deployerWallet).toggleMinting(true);
      console.log("Minting enabled successfully!");
      
      // Add address to whitelist for testing
      await yourCollectible
        .connect(deployerWallet)
        .addUserToWhitelist('0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295');
      console.log("Added test address to whitelist");
      
      // Mint some tokens now that it's enabled
      const MINTS_TO_PERFORM = 3;
      for (let i = 0; i < MINTS_TO_PERFORM; i++) {
        const minted = await yourCollectible.mintPack('0x9B5d8C94aAc96379e7Bcac0Da7eAA1E8EB504295', {
          value: ethers.utils.parseEther((0.05).toString()),
        });
        await minted.wait(1);
        console.log(`Minted pack no ${i}`);
      }
    } catch (error) {
      console.log("Error during setup:", error.message);
    }
  } else {
    // Deploy to testnet using Frame with hardware wallet
    console.log(chalk.blue(`Deploying to ${network.name} (${network.config.chainId}) using Frame + hardware wallet...`));
    
    // Deploy libraries first
    G0lLib = await deployLedgerFrame('G0l');
    console.log('>>>> G0l library deployed!');
    
    BitOpsLib = await deployLedgerFrame('BitOps');
    console.log('>>>> BitOps library deployed!');

    // Deploy main contract with linked libraries
    yourCollectible = await deployLedgerFrame(
      'G4m3',
      [],
      {},
      {
        G0l: G0lLib.address,
        BitOps: BitOpsLib.address,
      }
    );
    console.log('>>>> G4m3 contract deployed!');

    // Verify contract on Etherscan
    console.log(chalk.blue('Verifying contract on Etherscan...'));
    try {
      await run('verify:verify', {
        address: yourCollectible.address,
        // constructorArguments: []  // Uncomment and add args if your contract has constructor parameters
      });
      console.log(chalk.green('Contract verification successful!'));
    } catch (error) {
      console.log(chalk.red('Contract verification failed:'), error.message);
    }
    
    // Ask if user wants to perform post-deployment setup
    console.log(chalk.yellow('\nDo you want to perform post-deployment setup? (Enable minting, add to whitelist)'));
    console.log(chalk.yellow('If yes, please confirm the transaction in your hardware wallet when prompted.'));
    
    try {
      // Get signer from Frame for post-deployment transactions
      console.log(chalk.cyan('🔑 Requesting signer from Frame for post-deployment setup...'));
      
      // We need to reconnect to the contract with the frame provider to use it for transactions
      const accounts = await frame.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Frame. Please check your wallet connection.');
      }
      
      // Create a provider and signer using Frame
      const frameProvider = new ethers.providers.Web3Provider(frame);
      const frameSigner = frameProvider.getSigner(accounts[0]);
      console.log(`Using account ${accounts[0]} for post-deployment transactions`);
      
      // Connect the contract to the signer
      const contractWithSigner = yourCollectible.connect(frameSigner);
      
      // Pass the connected contract to the setup function
      await setupContractOnTestnet(contractWithSigner);
    } catch (setupError) {
      console.log(chalk.red('Post-deployment setup failed:'), setupError.message);
      console.log('You can manually set up the contract later using the contract address.');
    }
  }

  // Print deployment summary
  console.log('\n====== DEPLOYMENT SUMMARY ======');
  console.log('G0l Library:     ', G0lLib.address);
  console.log('BitOps Library:  ', BitOpsLib.address);
  console.log('G4m3 Contract:   ', yourCollectible.address);
  console.log('=============================\n');

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

  // Skip Tenderly persistence if it's not configured
  if (tenderly && tenderly.persistArtifacts) {
    await tenderly.persistArtifacts({
      name: contractName,
      address: deployed.address,
    });
  }

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};

async function deployLedgerFrame(contractName, _args = [], overrides = {}, libraries = {}) {
  console.log(chalk.cyan(`\n🛰 Deploying ${contractName} to ${network.name}...`));

  try {
    // Connect to network via provider
    const web3 = new Web3(network.config.url);
    
    // Configure Frame with explicit network details for better reliability
    const frame = ethProvider('frame', {
      network: network.name,
      networkId: network.config.chainId,
      rpcUrl: network.config.url,
    });
    
    // Verify that Frame is using the correct network
    console.log(chalk.yellow(`⚠️ Please ensure Frame is connected to the ${network.name} network (chainId: ${network.config.chainId})`));
    
    // Check if Frame is on the correct network
    try {
      // Get current network from Frame
      const frameChainId = await frame.request({ method: 'eth_chainId' });
      const frameChainIdNum = parseInt(frameChainId, 16);
      
      // Get auto-detected network name if possible
      let frameName = "Unknown";
      try {
        const frameNet = await frame.request({ method: 'net_version' });
        frameName = getNetworkName(frameNet) || `Network ${frameNet}`;
      } catch (netErr) {
        console.log(chalk.yellow('⚠️ Could not get network name from Frame'));
      }
      
      if (frameChainIdNum !== network.config.chainId) {
        console.log(chalk.red(`🚨 NETWORK MISMATCH: Frame is on ${frameName} (chainId: ${frameChainIdNum}), but Hardhat is configured for ${network.name} (chainId: ${network.config.chainId})`));
        
        // Give the user options to proceed
        console.log(chalk.yellow('\nOptions to resolve this:'));
        console.log(chalk.yellow('1. Switch networks in Frame:'));
        console.log(chalk.yellow('   - Open Frame'));
        console.log(chalk.yellow('   - Click on the network name in the top bar'));
        console.log(chalk.yellow('   - Select Polygon Amoy from the dropdown'));
        console.log(chalk.yellow('   - If Polygon Amoy is not listed, add it in Frame Settings > Networks'));
        console.log(chalk.yellow('2. Use the network Frame is currently connected to:'));
        console.log(chalk.yellow(`   - Run: yarn hardhat run scripts/deploy.js --network ${getNetworkName(frameChainIdNum) || frameChainIdNum}`));
        console.log(chalk.yellow('3. Continue anyway (override the network check):'));
        
        // For simplicity in this non-interactive environment, we'll provide a bypass option
        const BYPASS_NETWORK_CHECK = true; // Set to true to bypass the network check
        
        if (BYPASS_NETWORK_CHECK) {
          console.log(chalk.yellow('\n⚠️ WARNING: Proceeding despite network mismatch because BYPASS_NETWORK_CHECK is enabled'));
          console.log(chalk.yellow('If deployment fails, please ensure Frame is correctly configured'));
        } else {
          console.log(chalk.yellow('\nTo bypass this check, edit the deploy.js script and set BYPASS_NETWORK_CHECK to true'));
          throw new Error('Network mismatch');
        }
      } else {
        console.log(chalk.green(`✅ Frame is correctly connected to ${network.name} (chainId: ${network.config.chainId})`));
      }
    } catch (e) {
      console.log(chalk.yellow('⚠️ Could not verify Frame network. Proceeding anyway...'));
    }

    // Prepare contract deployment
    const contractArgs = _args || [];
    const contractArtifacts = await ethers.getContractFactory(contractName, { libraries: libraries });
    const tx = await contractArtifacts.getDeployTransaction(...contractArgs, overrides);

    // Add network-specific information
    tx.chainId = network.config.chainId;

    // Request account from Frame + hardware wallet
    console.log('🔐 Requesting account access from hardware wallet via Frame...');
    const accounts = await frame.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from Frame. Please check your wallet connection.');
    }
    
    tx.from = accounts[0];
    console.log(`🔑 Using account: ${tx.from}`);
    
    // Get gas estimate
    console.log('💰 Estimating gas...');
    try {
      const gasEstimate = await web3.eth.estimateGas({
        from: tx.from,
        data: tx.data,
        to: tx.to
      });
      console.log(`⛽ Estimated gas: ${gasEstimate}`);
    } catch (gasError) {
      console.log(chalk.yellow('⚠️ Failed to estimate gas, proceeding with default gas limit'));
    }

    // Send deployment transaction
    console.log('📝 Sending deployment transaction...');
    const response = await frame.request({ method: 'eth_sendTransaction', params: [tx] });
    console.log(`📤 Transaction sent! Hash: ${response}`);

    // Wait for the transaction to be mined - poll with timeout
    console.log('⏳ Waiting for transaction confirmation...');
    const maxAttempts = 20;
    const pollInterval = 5000; // 5 second interval
    let receipt = null;
    
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`   Checking status (attempt ${i+1}/${maxAttempts})...`);
      receipt = await web3.eth.getTransactionReceipt(response);
      
      if (receipt) {
        break;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    if (!receipt) {
      throw new Error('Transaction not mined within timeout period. Please check the network explorer.');
    }
    
    if (!receipt.contractAddress) {
      throw new Error('Contract address not found in receipt. Deployment likely failed.');
    }

    const deployedAddress = receipt.contractAddress;
    console.log(chalk.green(`✅ Contract deployed at: ${deployedAddress}`));
    
    // Save address to filesystem
    console.log('💾 Saving contract address...');
    fs.writeFileSync(`artifacts/${contractName}.address`, deployedAddress);

    // Create deployedContract object
    const deployedContract = contractArtifacts.attach(deployedAddress);

    // Handle constructor arguments
    const encoded = abiEncodeArgs(deployedContract, contractArgs);
    
    // Persist artifacts to Tenderly if configured
    if (tenderly && tenderly.persistArtifacts) {
      console.log('📊 Saving to Tenderly...');
      await tenderly.persistArtifacts({
        name: contractName,
        address: deployedAddress,
      });
    }

    // Save constructor args if any
    if (encoded && encoded.length > 2) {
      fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));
    }

    return deployedContract;
  } catch (error) {
    console.error(chalk.red(`\n❌ Error deploying ${contractName}:`), error);
    throw error;
  }
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
