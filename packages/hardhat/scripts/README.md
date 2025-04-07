# Deployment Scripts

This directory contains scripts for deploying and managing contracts on various networks.

## Deploying to Polygon Amoy Testnet

Polygon Amoy is the current testnet for Polygon, replacing the deprecated Mumbai testnet.

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

3. **Run the deployment script**:
   ```bash
   # Use yarn to run the local hardhat installation (recommended)
   yarn hardhat run scripts/deploy.js --network amoy
   
   # Alternatively, if you encounter issues with yarn:
   npx --no-install hardhat run scripts/deploy.js --network amoy
   ```

4. **Follow the prompts** to sign transactions with your hardware wallet

### Post-Deployment

After deployment, the script will:
1. Verify contracts on Amoy Polygonscan
2. Set up the contract (enable minting, whitelist)
3. Print a summary of the deployment

### Contract Verification

If contract verification fails, you can manually verify using:
```bash
npx hardhat verify --network amoy CONTRACT_ADDRESS
```

### Useful Links

- [Amoy Polygonscan](https://amoy.polygonscan.com)
- [Amoy Faucet](https://amoy.polygonscan.com/faucet)
- [Frame Documentation](https://frame.sh/docs/)