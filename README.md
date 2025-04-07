# 👾 g4m3 0f l1f3

On chain implementation of Conway's Game of Life with more colors & quirks than what you may be used to. The implementation uses an 8x8 grid with toroidal wrapping and features animated SVG outputs.

Project scaffolding from [scaffold-eth](https://github.com/austintgriffith/scaffold-eth.git) ❤️

## Setup

```bash
git clone git@github.com:0xm3tatr0n/g4m3-0f-l1f3.git g4m3-0f-l1f3

cd g4m3-0f-l1f3

git checkout svg-attempt

yarn install
```

## Running the App

```bash
# Start the frontend
yarn start

# In a second terminal window, start a local blockchain
yarn chain

# In a third terminal window, deploy the contracts
yarn deploy
```

📱 Open http://localhost:3000 to see the app

## Testing and Generating SVGs

Run these commands from the `packages/hardhat` directory:

```bash
# Run basic tests
yarn hardhat test

# Generate SVGs from G4m3 contract (creates individual SVG files)
yarn hardhat run scripts/generate-svgs.js --network hardhat

# Run a full Game of Life simulation until completion
yarn hardhat test test/generateSvgs.js --network hardhat
```

**Note:** If you encounter a "non-local installation of Hardhat" error when using `npx hardhat`, use the `yarn hardhat` commands shown above instead.

The generated SVGs and metadata will be saved in the `packages/hardhat/exerpts/runs` directory with a unique UUID for each run.

## Deploying to Polygon Amoy Testnet

The project can be deployed to Polygon Amoy testnet (the current Polygon testnet, which replaced Mumbai).

> **Note about NFT Collection Checks**: The contract checks ownership of specific NFT collections on Ethereum mainnet to determine eligibility for free mints. Since these NFT collections don't exist on Amoy, the deployment script automatically adds addresses to the whitelist to maintain functionality. No contract modifications needed!

### Prerequisites

1. **Frame**: Install [Frame](https://frame.sh/) for hardware wallet integration
2. **Hardware wallet**: Connect your hardware wallet (e.g., Ledger) to your computer
3. **Alchemy API key**: Create an account on [Alchemy](https://www.alchemy.com/) and get an API key for Polygon Amoy
4. **Configure Polygon Amoy in Frame**:
   - Open Frame
   - Go to Settings > Networks > Add Network
   - Fill in the following details:
     - **Network Name**: Polygon Amoy
     - **Chain ID**: 80002
     - **Symbol**: MATIC
     - **RPC URL**: https://rpc.polygon-amoy.quiknode.pro (or your Alchemy URL)
     - **Block Explorer**: https://amoy.polygonscan.com
   - After adding, select Amoy from the network dropdown
5. **Test MATIC**: Get some test MATIC from [Amoy Faucet](https://amoy.polygonscan.com/faucet)

### Deployment Steps

1. **Set up environment variables**:
   ```bash
   export ALCHEMY_URL_AMOY=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
   ```

2. **Make sure Frame is running** and connected to your hardware wallet

3. **Run the deployment script** from the `packages/hardhat` directory:
   ```bash
   cd packages/hardhat
   
   # Use yarn to run the local hardhat installation (recommended)
   yarn hardhat run scripts/deploy.js --network amoy
   
   # Alternatively, if you encounter issues with yarn:
   npx --no-install hardhat run scripts/deploy.js --network amoy
   
   # Or using the direct path to the local hardhat binary:
   ./node_modules/.bin/hardhat run scripts/deploy.js --network amoy
   ```
   
   > **Note:** Using `npx hardhat` without the `--no-install` flag may cause an error about using a non-local installation of Hardhat.

4. **Follow the prompts** to sign transactions with your hardware wallet

5. **After deployment**, run the publish script to make the contracts available to the frontend:
   ```bash
   # Use yarn to run the publish script
   yarn hardhat run scripts/publish.js --network amoy
   ```

6. **Configure the frontend** to connect to Amoy by editing `packages/react-app/.env`:
   ```
   REACT_APP_PROVIDER=https://rpc.polygon-amoy.quiknode.pro
   REACT_APP_NETWORK_ID=80002
   ```

7. **Start the frontend** to interact with your deployed contract:
   ```bash
   cd ../react-app
   yarn start
   ```

For more details, see the [deployment script documentation](packages/hardhat/scripts/README.md).

### Deployment to Polygon Amoy - Example

A successful deployment to Polygon Amoy has been completed! The contracts are deployed and verified at these addresses:

- G0l Library: [`0xc9Eb8884752497eD35747E91053C8F88fbcC7AC7`](https://amoy.polygonscan.com/address/0xc9Eb8884752497eD35747E91053C8F88fbcC7AC7)
- BitOps Library: [`0x2457aD942d63f25cbA6981C7A5aa3e049a7c281D`](https://amoy.polygonscan.com/address/0x2457aD942d63f25cbA6981C7A5aa3e049a7c281D)
- G4m3 Contract: [`0x149D4C0578A04c3A1D3c5cB9821EFC5bfe25E965`](https://amoy.polygonscan.com/address/0x149D4C0578A04c3A1D3c5cB9821EFC5bfe25E965#code)

### Troubleshooting Deployment Issues

If you encounter issues during deployment, here are some common fixes:

1. **Frame Network Mismatch Error**:
   - If you see a "NETWORK MISMATCH" error, there are 3 options:
     - **Switch networks in Frame**:
       - Open Frame
       - Click on the network name in the top bar (this might be "Ethereum Mainnet" or similar)
       - Select "Polygon Amoy" from the dropdown
       - If Polygon Amoy is not in the list, add it in Frame's Settings > Networks
     - **Use Frame's current network**:
       - The error message will show which network to use
       - Run the deployment with that network instead: `yarn hardhat run scripts/deploy.js --network <current-frame-network>`
     - **Bypass the check**:
       - Edit the deploy.js script to set `BYPASS_NETWORK_CHECK = true`
       - Run the script again

2. **Transaction Failures**:
   - Check if you have enough test MATIC
   - Try increasing gas limit/price in hardhat.config.js
   - Ensure you're using an up-to-date RPC URL for Amoy

3. **Contract Verification Failures**:
   - If automatic verification fails, you can verify manually:
   ```bash
   npx hardhat verify --network amoy CONTRACT_ADDRESS
   ```
   - Make sure you've set the correct Polygonscan API key

4. **Frontend Connection Issues**:
   - Double-check your `.env` file settings match the deployed network
   - Use the correct contract addresses by running the publish script
   - Clear your browser cache if you see outdated contract data

## Gas Usage Analysis

The contract uses optimized bitwise operations to minimize gas costs. You can analyze gas usage with several approaches:

Run these commands from the `packages/hardhat` directory:

```bash
# Run the read gas tests to measure tokenURI gas costs
yarn hardhat test test/readGasTest.js --network hardhat

# Run comprehensive mint gas tests (measures gas costs for all mint functions)
yarn hardhat test test/mintGasTest.js --network hardhat

# Run gas reporter on any test to see detailed gas metrics
# This will generate a detailed gas report in exerpts/gas-reports
REPORT_GAS=true yarn hardhat test

# Measure general operation gas costs
yarn hardhat test test/baseTest.js --network hardhat

# Get a complete gas profile during deployment
yarn hardhat run scripts/deploy.js --network localhost
```

Gas reports are automatically saved to the `exerpts/gas-reports` directory with unique identifiers.

### Gas Units vs. Gas Cost

The reported gas values are in **gas units**, which measure computational complexity:

- **Gas units**: The amount of computation required (fixed per operation)
- **Gas price**: The cost per unit of gas (variable, set by the network in gwei)
- **ETH cost**: gas units × gas price

For example, at a gas price of 20 gwei:

- 100,000 gas units = 0.002 ETH
- 250,000 gas units = 0.005 ETH

### Key Gas Optimizations

This contract includes several gas optimizations:

- Bitwise operations for Game of Life state calculations (~47% savings)
- Optimized state initialization with efficient randomness (~8% savings)
- Fixed-size grid (8x8) packed into a single uint64
- Read operation optimizations for tokenURI and SVG generation
- Epoch/generation tracking to detect and break cycles
