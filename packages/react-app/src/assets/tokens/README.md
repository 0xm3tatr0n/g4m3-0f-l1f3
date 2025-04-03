# Static Token Files

This directory contains JSON files for all extracted NFT tokens.

## How to Populate

Run one of the following commands from the `react-app` directory:

```bash
# Extract existing tokens from the blockchain
yarn extract-tokens

# Mint new tokens and extract them
yarn mint-tokens <count>

# Mint tokens until reaching a specific total
yarn mint-to-end <total>
```

See `STATIC-TOKENS.md` in the root directory for more information.

## File Structure

Each token is stored as a JSON file with its token ID as the filename:

```
1.json
2.json
3.json
...
```

These files are automatically imported and used by the Gallery component to display tokens without requiring blockchain queries for each token.