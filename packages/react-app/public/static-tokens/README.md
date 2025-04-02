# Static Token Storage System

This directory contains static JSON files for NFT tokens from the G4m3 contract. Instead of fetching token data from the blockchain every time, the application first checks if the data is available statically.

## Overview

The static token system serves three main purposes:
1. **Performance**: Dramatically reduce RPC calls to the blockchain
2. **Reliability**: Gallery works even during blockchain RPC downtime
3. **Cost**: Lower infrastructure costs by reducing API usage

## Structure

- `manifest.json` - Central metadata file with information about the stored tokens:
  ```json
  {
    "lastUpdated": "2025-04-02T09:39:19.817Z",
    "totalTokensStored": 5,
    "minTokenId": 1,
    "maxTokenId": 5,
    "version": "1.0"
  }
  ```

- `{tokenId}.json` - Individual token metadata files named by their token ID
  - Contains the same JSON data that would be returned by `tokenURI()`
  - Includes token image, attributes, and metadata

## How The System Works

### Frontend Logic Flow

1. When the gallery loads, it first fetches and parses `manifest.json`
2. For tokens within the stored range (`minTokenId` to `maxTokenId`):
   - Attempts to fetch from `/static-tokens/{id}.json` first
   - Only falls back to RPC calls if the static file isn't found
3. For tokens outside the stored range (newer tokens):
   - Uses traditional RPC calls to fetch data
4. Combines results from both sources into a unified collection
5. Caches results in browser localStorage for even faster repeat access

### Extraction Process

The extraction script:
1. Connects to the contract (existing or deploys a new one)
2. Optionally mints tokens (if `MINT_TO_MAX` is enabled)
3. Fetches token data for the specified range
4. Saves token data as individual JSON files
5. Updates the manifest with new metadata

## Updating The Static Cache

### GitHub Actions Automation

This repository uses a GitHub Action to periodically update the static token data:
- **Scheduled**: Runs automatically every day at midnight (UTC)
- **On Push**: Updates when code is pushed to the main branch
- **Manual**: Can be triggered from the GitHub Actions UI

When running the GitHub Action manually, you can configure:
- Starting token ID
- Maximum number of tokens to extract
- Whether to mint to maximum capacity first

### Local Updates

To update the static token files locally:

1. Navigate to the hardhat directory:
   ```
   cd packages/hardhat
   ```

2. Use one of the npm scripts:
   ```
   yarn extract-tokens         # Extract with default parameters
   yarn extract-tokens:test    # Extract 5 tokens with batch size 3
   yarn extract-tokens:all     # Extract all available tokens
   yarn extract-tokens:max     # Mint to maximum capacity then extract all tokens
   ```

3. Or run the extraction script directly with custom parameters:
   ```bash
   # Using environment variables
   START_TOKEN_ID=1 BATCH_SIZE=10 MAX_TOKENS=20 npx hardhat run scripts/extract-tokens-to-static.js --network localhost
   
   # To mint to maximum capacity:
   MINT_TO_MAX=true npx hardhat run scripts/extract-tokens-to-static.js --network localhost
   ```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `START_TOKEN_ID` | Token ID to start extracting from | 1 |
| `BATCH_SIZE` | Number of tokens to process in each batch | 5 |
| `MAX_TOKENS` | Maximum number of tokens to process | 10 (0 = all) |
| `MINT_TO_MAX` | Whether to mint to maximum capacity first | false |
| `CONTRACT_ADDRESS` | Address of existing contract to use | *Auto-deploys if not specified* |

### Minting to Maximum Capacity

The `MINT_TO_MAX` option:
- Mints tokens sequentially up to the contract's maximum limit
- Presents warnings and a 5-second delay before proceeding
- Shows progress indicators during the minting process
- Has built-in pauses to avoid overwhelming the node
- Handles errors gracefully, continuing to the next token

**Important**: Sequential minting is necessary because each token in G4m3 depends on the game state of the previous token.

## Benefits

- **Reduced RPC Load**: Minimal blockchain API calls, only for new tokens
- **Faster Performance**: Static file access is much faster than RPC calls
- **Better UX**: Gallery loads immediately, even for large collections
- **Reliability**: Gallery works even during blockchain RPC outages
- **Lower Costs**: Reduced infrastructure costs by minimizing API usage
- **Scaling**: System handles growing token collections efficiently