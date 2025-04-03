/**
 * Helper module for loading and managing static token files
 * Using direct imports from src/assets/tokens/ directory
 */

// Import all token data dynamically
// No tokens imported yet - will be populated by extract-tokens.js script

// Map of token ID to token data - empty until tokens are extracted
const staticTokens = {};

// TIP: After running `yarn extract-tokens`, this file will be auto-updated
// with all the proper imports and mappings - no need to edit it manually

// The manifest data directly embedded to avoid issues with loading JSON
const staticManifestData = {
  "lastUpdated": "2025-04-03T09:07:10.379Z",
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
    
    console.log(`Token #${tokenId} not available in static data`);
    return null;
  } catch (error) {
    console.log(`Error loading static token #${tokenId}:`, error);
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
      console.warn(`⚠️ Token #${tokenId} has no data`);
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
  
  console.log(`✅ Processed ${Object.keys(processedTokens).length} static tokens`);
  
  if (setLoadingCallback) {
    setLoadingCallback(false);
  }
  
  return processedTokens;
}