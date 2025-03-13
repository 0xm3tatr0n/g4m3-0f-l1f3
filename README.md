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
