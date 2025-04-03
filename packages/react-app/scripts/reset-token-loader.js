/**
 * Reset Token Loader Script
 * 
 * This script resets the staticTokenLoader.js file to a clean state
 * with no token imports when the tokens directory is cleared.
 * 
 * This ensures the app will still work properly even when no tokens have been extracted.
 */

const fs = require('fs-extra');
const path = require('path');

async function main() {
  try {
    console.log("Resetting staticTokenLoader.js to clean state...");
    
    // Path to the static token loader file
    const staticLoaderPath = path.join(__dirname, "../src/helpers/staticTokenLoader.js");
    
    // Create a clean version of the file with no token imports
    const cleanContent = `/**
 * Helper module for loading and managing static token files
 * Using direct imports from src/assets/tokens/ directory
 */

// Import all token data dynamically
// No tokens imported yet - will be populated by extract-tokens.js script

// Map of token ID to token data - empty until tokens are extracted
const staticTokens = {};

// TIP: After running \`yarn extract-tokens\`, this file will be auto-updated
// with all the proper imports and mappings - no need to edit it manually

// The manifest data directly embedded to avoid issues with loading JSON
const staticManifestData = {
  "lastUpdated": "${new Date().toISOString()}",
  "totalTokensStored": 0,
  "version": "1.0"
};

/**
 * Gets the static manifest data
 * @returns {Object} The manifest data
 */
export function getStaticManifest() {
  return staticManifestData;
}

/**
 * Load a static token file by ID
 * Using direct import from bundled files
 * 
 * @param {number} tokenId The token ID to load
 * @returns {Promise<Object|null>} The token data or null if not found
 */
export async function loadStaticToken(tokenId) {
  try {
    // Return the pre-loaded token data if available
    if (staticTokens[tokenId]) {
      return staticTokens[tokenId];
    }
    
    console.log(\`Token #\${tokenId} not available in static data\`);
    return null;
  } catch (error) {
    console.log(\`Error loading static token #\${tokenId}:\`, error);
    return null;
  }
}

/**
 * Loads all static tokens based on the manifest
 * @returns {Promise<Object>} An object mapping token IDs to token data
 */
export async function loadAllStaticTokens(setLoadingCallback = null) {
  if (setLoadingCallback) {
    setLoadingCallback(true);
  }
  
  console.log("🔍 loadAllStaticTokens called - preparing tokens from imports");
  
  // Process the imported tokens to ensure they have proper structure
  const processedTokens = {};
  
  // Add id property if missing and ensure everything is in correct format
  Object.entries(staticTokens).forEach(([tokenId, tokenData]) => {
    if (!tokenData) {
      console.warn(\`⚠️ Token #\${tokenId} has no data\`);
      return;
    }
    
    // Create a new object with processed data
    processedTokens[tokenId] = {
      ...tokenData,
      // Ensure ID is present and is a number
      id: tokenData.id || parseInt(tokenId),
      // Mark as coming from static storage
      source: 'static'
    };
  });
  
  console.log(\`✅ Processed \${Object.keys(processedTokens).length} static tokens\`);
  
  if (setLoadingCallback) {
    setLoadingCallback(false);
  }
  
  return processedTokens;
}`;
    
    // Write the clean file
    fs.writeFileSync(staticLoaderPath, cleanContent);
    console.log("✅ Successfully reset staticTokenLoader.js");
    
    // Make sure the tokens directory exists
    const tokensDir = path.join(__dirname, "../src/assets/tokens");
    fs.ensureDirSync(tokensDir);
    
    // Create a README.md file in the tokens directory
    const readmePath = path.join(tokensDir, "README.md");
    if (!fs.existsSync(readmePath)) {
      const readmeContent = `# Static Token Files

This directory contains JSON files for all extracted NFT tokens.

## How to Populate

Run one of the following commands from the \`react-app\` directory:

\`\`\`bash
# Extract existing tokens from the blockchain
yarn extract-tokens

# Mint new tokens and extract them
yarn mint-tokens <count>

# Mint tokens until reaching a specific total
yarn mint-to-end <total>
\`\`\`

See \`STATIC-TOKENS.md\` in the root directory for more information.

## File Structure

Each token is stored as a JSON file with its token ID as the filename:

\`\`\`
1.json
2.json
3.json
...
\`\`\`

These files are automatically imported and used by the Gallery component to display tokens without requiring blockchain queries for each token.`;
      
      fs.writeFileSync(readmePath, readmeContent);
      console.log("✅ Created README.md in tokens directory");
    }
    
    console.log("🎉 All done! The app should now work properly with an empty tokens directory.");
  } catch (error) {
    console.error("Error resetting token loader:", error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });