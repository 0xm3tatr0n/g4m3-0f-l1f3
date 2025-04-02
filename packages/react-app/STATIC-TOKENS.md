# Static Token Management for G4m3 of L1f3

This document explains how to manage static token files for the G4m3 of L1f3 NFT gallery.

## Overview

The gallery can load tokens from two sources:
1. **Static files** - JSON files stored in the `/src/assets/tokens/` directory
2. **Blockchain** - Tokens loaded directly from the contract via RPC calls

Using static files provides several benefits:
- Reduced RPC calls
- Faster loading times
- Works even when blockchain is unavailable
- Consistent token display

## Commands

The following commands are available to help manage static tokens. You can run these from either the `react-app` or `hardhat` package directories.

### From React-App Directory

Run these commands from the `packages/react-app` directory:

```bash
# Extract all tokens 
yarn extract-tokens

# Mint additional tokens
yarn mint-tokens <count>    # Example: yarn mint-tokens 10

# Mint to a specific total
yarn mint-to-end <total>    # Example: yarn mint-to-end 100

# Clear all token files
yarn clear-tokens
```

### From Hardhat Directory

Run these commands from the `packages/hardhat` directory:

```bash
# Extract all tokens 
yarn react:extract-tokens

# Mint additional tokens
yarn react:mint-tokens <count>    # Example: yarn react:mint-tokens 10

# Mint to a specific total
yarn react:mint-to-end <total>    # Example: yarn react:mint-to-end 100

# Clear all token files
yarn react:clear-tokens
```

> **⚠️ IMPORTANT**: When in the hardhat directory, you MUST use the `react:` prefix for all token commands. The commands without this prefix won't work from the hardhat directory.

### Command Details

#### Extract Existing Tokens

Extracts all tokens currently minted on the blockchain to static files:

```bash
yarn extract-tokens  # From react-app directory
# OR
yarn react:extract-tokens  # From hardhat directory
```

This will:
- Query the blockchain for all minted tokens
- Save each token as a JSON file in `/src/assets/tokens/`
- Update the imports in `staticTokenLoader.js`
- Update the manifest with token information

#### Mint New Tokens

Mints additional tokens and extracts them:

```bash
yarn mint-tokens <count>  # From react-app directory
# OR
yarn react:mint-tokens <count>  # From hardhat directory
```

Example:

```bash
yarn mint-tokens 10  # Mint 10 new tokens
```

This will:
1. Mint the specified number of new tokens
2. Extract those tokens to static files
3. Update the imports and manifest

#### Mint Until Reaching a Total

Mints tokens until reaching a specific total count:

```bash
yarn mint-to-end <total>  # From react-app directory
# OR
yarn react:mint-to-end <total>  # From hardhat directory
```

Example:

```bash
yarn mint-to-end 100  # Mint tokens until there are 100 total
```

This will:
1. Check the current supply
2. Mint enough additional tokens to reach the specified total
3. Extract all tokens to static files
4. Update the imports and manifest

## Workflow for Local Development

1. Start a fresh local blockchain:
   ```bash
   cd ../hardhat
   yarn chain
   ```

2. Deploy the contract:
   ```bash
   # In another terminal
   cd ../hardhat
   yarn deploy
   ```

3. Extract the current tokens:
   ```bash
   cd ../react-app
   yarn extract-tokens
   ```

4. Mint additional tokens if needed:
   ```bash
   yarn mint-tokens 10
   ```

5. Start the frontend:
   ```bash
   yarn start
   ```

## Troubleshooting

### Empty Gallery

If the gallery shows "No collectibles found":

1. Check that you've extracted tokens:
   ```bash
   yarn extract-tokens
   ```

2. If there are no tokens to extract, mint some:
   ```bash
   yarn mint-tokens 10
   ```

### Missing Static Files

If the `/src/assets/tokens/` directory is empty:

1. Run the extraction script:
   ```bash
   yarn extract-tokens
   ```

2. Check that the contract has tokens minted:
   ```bash
   cd ../hardhat
   yarn hardhat console --network localhost
   > const g4m3 = await ethers.getContractAt("G4m3", "<contract-address>")
   > (await g4m3.totalSupply()).toString()
   ```

### Issues After Reset

If you restart the local blockchain, you'll need to:

1. Deploy the contract again
2. Clear the static tokens directory:
   ```bash
   yarn clear-tokens
   ```
3. Run extraction again:
   ```bash
   yarn extract-tokens
   ```

This ensures your static files match the current blockchain state.

## Full Reset Workflow

This workflow completely resets your environment:

```bash
# Stop your current local blockchain (Ctrl+C in terminal running yarn chain)

# Deploy a new blockchain
cd ../hardhat
yarn chain

# In a new terminal
cd ../hardhat
yarn deploy

# Option 1: From react-app directory
cd ../react-app
yarn clear-tokens     # Clear all static tokens
yarn extract-tokens   # Extract tokens from the fresh contract
yarn start            # Start the frontend

# Option 2: From hardhat directory (stay in hardhat directory)
yarn react:clear-tokens     # Clear all static tokens
yarn react:extract-tokens   # Extract tokens from the fresh contract
cd ../react-app
yarn start                  # Start the frontend
```

> **IMPORTANT**: When in the `hardhat` directory, you must use the `react:` prefix for all token commands (e.g., `yarn react:mint-tokens 10`).