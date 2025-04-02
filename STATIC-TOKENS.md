# Static Token System for G4m3 NFTs

This project includes a static token storage system that improves gallery performance and reduces RPC load by serving token data from static files rather than blockchain queries.

## Features

- **Hybrid Data Loading**: Uses static files for existing tokens and RPC for new tokens
- **Automatic Token Extraction**: GitHub Actions workflow for automated updates
- **Sequential Minting**: Support for minting tokens to maximum capacity
- **Configurable Parameters**: Flexible extraction options for different scenarios
- **Efficient Caching**: Two-layer caching (static files + browser localStorage)

## Components

### 1. Static Files Storage
```
/packages/react-app/public/static-tokens/
├── manifest.json     # Metadata about stored tokens
├── 1.json            # Token #1 data
├── 2.json            # Token #2 data
└── ...               # More token files
```

### 2. Extraction Script
Path: `/packages/hardhat/scripts/extract-tokens-to-static.js`

Functions:
- Deploy contract if needed
- Enable minting via `toggleMinting(true)`
- Mint tokens if `MINT_TO_MAX` is enabled
- Extract token data via `tokenURI()`
- Save to static JSON files
- Update manifest

### 3. Frontend Integration
Path: `/packages/react-app/src/App.jsx`

Features:
- Fetches manifest on component mount
- Loads static tokens within manifest range
- Only uses RPC for tokens not in static storage
- Combines both data sources
- Caches in localStorage with TTL

### 4. GitHub Actions Automation
Path: `/.github/workflows/extract-tokens.yml`

Triggers:
- Daily at midnight (UTC)
- On push to main branch
- Manual triggering with parameters

## Usage

### Extracting Tokens Locally

```bash
# Navigate to hardhat directory
cd packages/hardhat

# Using npm/yarn scripts
yarn extract-tokens         # Default parameters
yarn extract-tokens:test    # Test with 5 tokens
yarn extract-tokens:all     # Extract all tokens
yarn extract-tokens:max     # Mint to maximum then extract all

# Direct script usage with custom parameters
START_TOKEN_ID=10 MAX_TOKENS=50 npx hardhat run scripts/extract-tokens-to-static.js
MINT_TO_MAX=true npx hardhat run scripts/extract-tokens-to-static.js
```

### GitHub Actions

The workflow can be triggered manually from the GitHub Actions UI with these parameters:
- Start token ID
- Maximum number of tokens
- Whether to mint to maximum capacity

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| START_TOKEN_ID | 1 | Token ID to start extraction from |
| BATCH_SIZE | 5 | Number of tokens to process in each batch |
| MAX_TOKENS | 10 (0 = all) | Maximum number of tokens to extract |
| MINT_TO_MAX | false | Whether to mint to max capacity first |

## Performance Benefits

- **API Load**: Reduces blockchain RPC calls by ~95% for established collections
- **Speed**: Loads gallery in milliseconds instead of seconds
- **Reliability**: Gallery works even when blockchain RPCs are unavailable

## Implementation Notes

1. **Sequential Minting**: Tokens are minted one by one to preserve game state dependencies
2. **User Safety**: The `MINT_TO_MAX` option has confirmation delays and is off by default
3. **Caching Strategy**: Combines static files, browser localStorage, and RPC fallbacks
4. **Error Handling**: Continues extracting tokens even if some fail
5. **Automation**: Designed for both manual and automated updates

## Future Enhancements

- Add support for incremental updates
- Implement delta extraction for more efficient updates
- Add compression for very large collections
- Create a user interface for token extraction management