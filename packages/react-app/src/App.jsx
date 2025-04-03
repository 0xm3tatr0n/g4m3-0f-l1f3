import { StaticJsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { formatEther, parseEther } from "@ethersproject/units";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Col, Row, Spin } from "antd";
import "antd/dist/antd.css";
import { useUserAddress } from "eth-hooks";
import React, { useCallback, useEffect, useState } from "react";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Address, Contract, Header, ItemCard, Gallery, MintInfo } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import { getStaticManifest, loadAllStaticTokens } from "./helpers/staticTokenLoader";
import { useBalance, useContractLoader, useContractReader, useGasPrice, useUserProvider, useLocalStorage } from "./hooks";
// Unused IPFS functionality removed

// Scaffold-eth boilerplate documentation removed

/// Network configuration
const targetNetwork = NETWORKS.localhost; // Force to localhost for local development
const DEBUG = false;

// Providers configuration
const mainnetInfura = new StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);

// Set up local provider
const localProviderUrl = targetNetwork.rpcUrl;
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
// Add a debugging message to check provider URL
console.log('🔌 Using provider URL:', localProviderUrlFromEnv);
const localProvider = new StaticJsonRpcProvider(localProviderUrlFromEnv);

// Block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

/*
  Web3 modal helps us "connect" external wallets:
*/
// Create web3Modal outside the component to avoid recreation on renders
let web3Modal;
if (typeof window !== "undefined") {
  web3Modal = new Web3Modal({
    // network: "mainnet", // optional
    cacheProvider: true, // optional
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: INFURA_ID,
        },
      },
    },
    theme: "dark",
    disableInjectedProvider: false,
  });
} else {
  web3Modal = null;
}

function App(props) {
  // Add redirection code to handle /debug prefix
  useEffect(() => {
    // Only in development mode, redirect from /debug to root
    if (window.location.pathname.startsWith('/debug')) {
      const newUrl = window.location.href.replace('/debug', '');
      window.history.pushState({}, '', newUrl);
    }
  }, []);

  // Configuration
  const DEFAULT_POLL_TIME = 60000;
  const mainnetProvider = mainnetInfura;

  // Render timestamp logging removed

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect === "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  const [injectedProvider, setInjectedProvider] = useState();

  // Gas price hook for transaction pricing
  const gasPrice = useGasPrice(targetNetwork, "fast", 120000);

  // User provider and address hooks
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);

  // Chain ID for network warning
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId = userProvider && userProvider._network && userProvider._network.chainId;

  // Transaction handler
  const tx = Transactor(userProvider, gasPrice);

  // Balance hooks
  const yourLocalBalance = useBalance(localProvider, address, 120000);

  // Contract loading hooks
  const readContracts = useContractLoader(localProvider);
  const writeContracts = useContractLoader(userProvider);

  // Check if connected wallet is a signer
  const isSigner = injectedProvider && injectedProvider.getSigner && injectedProvider.getSigner()._isSigner;

  // keep track of a variable from the contract in the local React state:
  const balance = useContractReader(readContracts, "G4m3", "balanceOf", [address], DEFAULT_POLL_TIME);

  // Only log in debug mode to reduce console noise
  if (DEBUG && balance) {
    console.log("🤗 NFT balance:", balance.toString());
  }
  // console.log(">>> reading free mint eligibility for", address);
  const isFreeMintEligible = useContractReader(
    readContracts,
    "G4m3",
    "isEligibleForFreeMint",
    [address],
    DEFAULT_POLL_TIME,
  );
  const freeMintsRemaining = useContractReader(
    readContracts,
    "G4m3",
    "freeMintsRemaining",
    [address],
    DEFAULT_POLL_TIME,
  );

  // track total supply - doesn't need address as an argument
  const totalSupply = useContractReader(readContracts, "G4m3", "totalSupply", [], DEFAULT_POLL_TIME);

  // 📟 Listen for broadcast events
  // const transferEvents = useEventListener(readContracts, "G4m3", "Transfer", localProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  //
  // State for NFT collections
  //
  const yourBalance = balance && balance.toNumber && balance.toNumber();
  
  // Use localStorage for caching collections - 1 day TTL (24 * 60 * 60 * 1000)
  const CACHE_TTL = 24 * 60 * 60 * 1000;
  const cacheKey = `collectibles-${address || "none"}`;
  const [yourCollectibles, setYourCollectibles] = useLocalStorage(cacheKey, [], CACHE_TTL);
  const [detectedCollectibles, setDetectedCollectibles] = useState(0);
  
  // Cache gallery NFTs by range with a unique key based on the range
  const [fullGallery, setFullGallery] = useLocalStorage('gallery-cache', {}, CACHE_TTL);
  const [galleryLoadRange, setGalleryLoadRange] = useState([1, 10]);
  // Start with loading=true until we've confirmed either way
  // More detailed loading state - can be 'idle', 'checking', 'loading', or 'complete'
  const [collectionLoadingState, setCollectionLoadingState] = useState("checking");
  const isLoadingCollection = collectionLoadingState === "checking" || collectionLoadingState === "loading";

  useEffect(() => {
    // new update your collectibles approach in two steps: 1) get owner's token IDs, 2) get tokenURIs for all IDs
    const updateOwenersCollectibles = async () => {
      try {
        // Early return if no connection or no address
        if (!readContracts || !readContracts.G4m3 || !address) {
          if (DEBUG) console.log("Missing required data to load collectibles");
          // Still in checking state until we have all needed data
          setCollectionLoadingState("checking");
          return;
        }

        // Check if we have cached collectibles that match current balance
        if (yourCollectibles && yourCollectibles.length > 0 && balance) {
          const balanceNum = balance.toNumber();
          if (balanceNum === yourCollectibles.length) {
            console.log("Using cached collectibles:", yourCollectibles.length);
            setCollectionLoadingState("complete");
            
            // Still check if there are newer tokens that might have replaced old ones
            // This handles the case where tokens were transferred in/out but total balance remained the same
            const totalSupply = await readContracts.G4m3.totalSupply();
            const cachedLastTokenId = Math.max(...yourCollectibles.map(c => c.id || 0));
            const currentMaxTokenId = totalSupply.toNumber();
            
            if (cachedLastTokenId >= currentMaxTokenId) {
              // Our cache contains the latest tokens, safe to use
              return;
            }
            console.log("Cache may be outdated - newest token ID is", currentMaxTokenId, "but cache only has up to", cachedLastTokenId);
            // Continue loading to refresh the cache
          }
        }

        // Start with "checking" state
        setCollectionLoadingState("checking");
        setDetectedCollectibles(0); // Reset counter for new load
        if (DEBUG) console.log("Loading collectibles for", address);

        // Use balance and tokenOfOwnerByIndex which is much more efficient
        // than checking ownership of every token
        const userBalance = await readContracts.G4m3.balanceOf(address);
        console.log(`User has ${userBalance.toString()} tokens`);
        
        // Get token IDs owned by this address using ERC721Enumerable methods
        const balanceNum = userBalance.toNumber();
        
        if (balanceNum === 0) {
          // No tokens, set empty array and return early
          setDetectedCollectibles(0);
          setCollectionLoadingState("complete");
          setYourCollectibles([]);
          return;
        }
        
        // Use ERC721Enumerable's tokenOfOwnerByIndex to get the token IDs
        const batchPromises = [];
        
        for (let i = 0; i < balanceNum; i++) {
          batchPromises.push(
            readContracts.G4m3.tokenOfOwnerByIndex(address, i)
              .then(tokenId => tokenId.toNumber())
              .catch(error => {
                console.error(`Error getting token at index ${i}:`, error);
                return null;
              })
          );
        }
        
        // Wait for all token index lookups to complete
        const ownedTokenIds = (await Promise.all(batchPromises)).filter(id => id !== null);

        // Set the detected count to show in the loading message
        setDetectedCollectibles(ownedTokenIds.length);

        // Now move to "loading" state since we've found the tokens
        setCollectionLoadingState("loading");

        // check if any collectibles owned
        if (ownedTokenIds.length > 0) {
          console.log(">>> updating owner collectibles: START");

          // console.log(">>> trying to update collectibles now ");
          const uriPromises = [];
          ownedTokenIds.forEach(id => {
            uriPromises.push(readContracts.G4m3.tokenURI(id));
          });

          const uris = await Promise.all(uriPromises);
          console.log(">>> Retrieved URIs:", uris);

          try {
            // trying to parse URIs
            const collectibleUpdate = uris.map((u, idx) => {
              const jsonManifestString = atob(u.substring(29));
              const jsonManifest = JSON.parse(jsonManifestString);
              return { id: ownedTokenIds[idx], uri: u, owner: address, ...jsonManifest };
            });

            setYourCollectibles(collectibleUpdate.reverse());
            // Set loading state to complete
            setCollectionLoadingState("complete");
          } catch (error) {
            console.log("error parsing collectible URIs: ", error);
            console.log(">>> updating owner collectibles: ERROR");
          }
        } else {
          // No tokens found, mark as complete
          setCollectionLoadingState("complete");
        }
      } catch (error) {
        console.log("Error loading collectibles:", error);
        // Error occurred, mark as complete
        setCollectionLoadingState("complete");
      }
    };

    // Only try to update if we have the necessary data
    if (address && readContracts && readContracts.G4m3) {
      updateOwenersCollectibles();
    } else {
      // Stay in checking state if we don't have the needed data yet
      setCollectionLoadingState("checking");
    }
  }, [address, yourBalance, readContracts]);

  // load all tokens into state with a larger default range
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  
  // State to manage chunk loading
  const [currentChunk, setCurrentChunk] = useState(1);
  const [maxChunksLoaded, setMaxChunksLoaded] = useState(false);
  const CHUNK_SIZE = 5;
  
  // Static tokens manifest data
  const [staticManifest, setStaticManifest] = useState(null);
  const [loadingStaticManifest, setLoadingStaticManifest] = useState(false);
  const [staticTokensById, setStaticTokensById] = useState({});
  
  // Load static tokens on component mount 
  useEffect(() => {
    const loadStaticTokenData = async () => {
      try {
        // Set loading state
        setLoadingStaticManifest(true);
        
        // Get the static manifest directly from our utility
        const manifest = getStaticManifest();
        console.log("📚 Using static manifest:", manifest);
        setStaticManifest(manifest);
        
        // Check if totalTokensStored is 0 or if minTokenId/maxTokenId are missing
        // This handles both cases: empty directory or no tokens extracted yet
        if (!manifest.totalTokensStored || manifest.totalTokensStored === 0 || 
            !manifest.minTokenId || !manifest.maxTokenId) {
          console.log("⚠️ No static tokens found. Run 'yarn extract-tokens' to populate the gallery.");
          
          // Add empty array to gallery
          const rangeKey = "static-tokens-all";
          setFullGallery(prevGallery => ({
            ...prevGallery,
            [rangeKey]: []
          }));
          
          // Check if we need to load from RPC when no static tokens exist
          if (readContracts && readContracts.G4m3) {
            try {
              const totalSupply = await readContracts.G4m3.totalSupply();
              const totalSupplyNum = totalSupply.toNumber();
              console.log(`📊 Total supply from contract: ${totalSupplyNum}`);
              
              if (totalSupplyNum > 0) {
                // Load all tokens from RPC since none exist in static storage
                console.log(`🔄 Loading ${totalSupplyNum} tokens from RPC (no static tokens found)`);
                setGalleryLoadRange([1, totalSupplyNum]);
              } else {
                console.log("📊 No tokens minted yet");
                setMaxChunksLoaded(true);
              }
            } catch (error) {
              console.error("Error checking total supply:", error);
              setMaxChunksLoaded(true);
            }
          } else {
            setMaxChunksLoaded(true);
          }
          
          setLoadingStaticManifest(false);
          return;
        }
        
        // Load all static tokens
        console.log(`📂 Loading static tokens from ${manifest.minTokenId} to ${manifest.maxTokenId}`);
        const tokens = await loadAllStaticTokens();
        
        const tokenCount = Object.keys(tokens).length;
        console.log(`✅ Successfully loaded ${tokenCount} static tokens`);
        
        // Debug log the first few tokens to check their structure
        const tokenIds = Object.keys(tokens).slice(0, 3);
        console.log("📝 Example tokens:", tokenIds.map(id => ({id, data: tokens[id]})));
        
        // Store static tokens in state
        setStaticTokensById(tokens);
        
        // Create an entry in the gallery for static tokens
        // Always create an entry in the gallery for static tokens, even if empty
        const staticTokenArray = Object.values(tokens);
        console.log("🔍 Static tokens available:", staticTokenArray.length);
        
        if (staticTokenArray.length > 0) {
          // Count by epoch for reporting
          const epochCounts = {};
          
          console.log("🔍 Examining static token array:", staticTokenArray.length, "tokens");
            
          // Debug the first few tokens to check their structure
          console.log("🔍 First few tokens:", staticTokenArray.slice(0, 3));
          
          staticTokenArray.forEach((token, idx) => {
            // Debug every 50th token
            if (idx % 50 === 0) {
              console.log(`Token #${idx}:`, token);
            }
            
            let epoch = "Unknown";
            if (token.attributes) {
              const epochAttr = token.attributes.find(attr => attr.trait_type === "epoch");
              if (epochAttr) epoch = epochAttr.value.replace('#', '');
            }
            epochCounts[epoch] = (epochCounts[epoch] || 0) + 1;
          });
          
          console.log("📊 Static tokens by epoch:", epochCounts);
        } else {
          console.log("⚠️ No static tokens found. Run 'yarn extract-tokens' to populate the gallery.");
        }
        
        // Always add to gallery, even if empty - use different key format to ensure it's not filtered out
        const rangeKey = "static-tokens-all";
        console.log(`📊 Adding ${staticTokenArray.length} tokens to gallery with key ${rangeKey}`);
        setFullGallery(prevGallery => {
          const newGallery = {
            ...prevGallery,
            [rangeKey]: staticTokenArray
          };
          console.log("📚 Updated gallery:", Object.keys(newGallery).map(k => `${k}: ${newGallery[k]?.length || 0} items`));
          return newGallery;
        });
        
        // Check if we need to load additional tokens from RPC
        if (readContracts && readContracts.G4m3) {
          const totalSupply = await readContracts.G4m3.totalSupply();
          const totalSupplyNum = totalSupply.toNumber();
          console.log(`📊 Total supply from contract: ${totalSupplyNum}`);
          
          if (totalSupplyNum > manifest.maxTokenId) {
            // Need to load more tokens from RPC
            console.log(`🔄 Need to load ${totalSupplyNum - manifest.maxTokenId} more tokens from RPC`);
            setGalleryLoadRange([manifest.maxTokenId + 1, totalSupplyNum]);
          } else {
            console.log("✅ All tokens are available in static storage");
            setMaxChunksLoaded(true);
          }
        }
      } catch (error) {
        console.log("❌ Error loading static tokens:", error);
        // Set an empty gallery when errors occur
        setFullGallery(prevGallery => ({
          ...prevGallery,
          "static-tokens-all": []
        }));
        setMaxChunksLoaded(true);
      } finally {
        setLoadingStaticManifest(false);
      }
    };
    
    loadStaticTokenData();
  }, [readContracts]);
  
  // Reset chunk loader when component mounts or route changes
  useEffect(() => {
    const handleRouteChange = () => {
      // Reset the chunk counter if we're visiting the gallery
      if (window.location.hash.includes('/gallery')) {
        setCurrentChunk(1);
        setMaxChunksLoaded(false);
      }
    };
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleRouteChange);
    
    // Initial check
    handleRouteChange();
    
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);
  
  // Load additional tokens from RPC when needed
  useEffect(() => {
    const loadAdditionalTokensFromRPC = async () => {
      // Skip if no range or if static tokens are still loading
      if (!galleryLoadRange || galleryLoadRange.length !== 2 || loadingStaticManifest) {
        return;
      }
      
      // Skip if no contract access
      if (!readContracts || !readContracts.G4m3) {
        return;
      }
      
      try {
        const [startId, endId] = galleryLoadRange;
        console.log(`🔄 Loading additional tokens from RPC: ${startId} to ${endId}`);
        
        setIsLoadingGallery(true);
        
        // Process in batches
        const BATCH_SIZE = 5;
        let additionalTokens = [];
        
        for (let i = startId; i <= endId; i += BATCH_SIZE) {
          const batchEnd = Math.min(i + BATCH_SIZE - 1, endId);
          
          // Log progress
          if ((i - startId) % 10 === 0 || i === startId) {
            console.log(`🔄 Loading RPC batch ${i}-${batchEnd} (${Math.round((i-startId)/(endId-startId+1)*100)}%)`);
          }
          
          // Process each token in the batch
          const batchPromises = [];
          for (let tokenId = i; tokenId <= batchEnd; tokenId++) {
            batchPromises.push(
              (async () => {
                try {
                  // Skip if we already have this token in static storage
                  if (staticTokensById[tokenId]) {
                    return null;
                  }
                  
                  // Check if token exists
                  await readContracts.G4m3.ownerOf(tokenId);
                  
                  // Get token data
                  const tokenURI = await readContracts.G4m3.tokenURI(tokenId);
                  const base64 = tokenURI.split('base64,')[1];
                  const jsonString = atob(base64);
                  const jsonManifest = JSON.parse(jsonString);
                  
                  return {
                    id: tokenId,
                    ...jsonManifest,
                    uri: tokenURI,
                    owner: await readContracts.G4m3.ownerOf(tokenId),
                    source: 'rpc'
                  };
                } catch (error) {
                  // Token doesn't exist or other error
                  return null;
                }
              })()
            );
          }
          
          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);
          
          // Add valid tokens to our collection
          const validTokens = batchResults.filter(t => t !== null);
          additionalTokens = [...additionalTokens, ...validTokens];
          
          // Pause between batches
          if (i + BATCH_SIZE <= endId) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Add additional tokens to the gallery
        if (additionalTokens.length > 0) {
          console.log(`✅ Loaded ${additionalTokens.length} additional tokens from RPC`);
          
          // Count by epoch
          const epochCounts = {};
          additionalTokens.forEach(token => {
            let epoch = "Unknown";
            if (token.attributes) {
              const epochAttr = token.attributes.find(attr => attr.trait_type === "epoch");
              if (epochAttr) epoch = epochAttr.value.replace('#', '');
            }
            epochCounts[epoch] = (epochCounts[epoch] || 0) + 1;
          });
          
          console.log("📊 RPC tokens by epoch:", epochCounts);
          
          // Add to gallery
          const rangeKey = `rpc-tokens-${startId}-${endId}`;
          setFullGallery(prevGallery => ({
            ...prevGallery,
            [rangeKey]: additionalTokens
          }));
        }
        
        // Mark loading as complete
        setMaxChunksLoaded(true);
      } catch (error) {
        console.log("❌ Error loading additional tokens from RPC:", error);
      } finally {
        setIsLoadingGallery(false);
      }
    };
    
    if (readContracts && readContracts.G4m3 && !loadingStaticManifest) {
      loadAdditionalTokensFromRPC();
    }
  }, [galleryLoadRange, readContracts, staticTokensById, loadingStaticManifest]);

  // We don't need this function anymore since we're loading everything directly
  // in the previous useEffect hook

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      // yourMainnetBalance &&
      readContracts &&
      writeContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      // console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? formatEther(yourLocalBalance) : "...");
      // console.log("💵 yourMainnetBalance", yourMainnetBalance ? formatEther(yourMainnetBalance) : "...");
      // console.log("📝 readContracts", readContracts);
      // console.log("🔐 writeContracts", writeContracts);
      console.log("🏃‍♀️ is eligible for free mint ", isFreeMintEligible);
      if (freeMintsRemaining && freeMintsRemaining.toString()) {
        console.log("🏃‍♀️ free mints remaining ", freeMintsRemaining.toString());
      }
    }
  }, [mainnetProvider, address, selectedChainId, yourLocalBalance, readContracts, writeContracts]);

  let networkDisplay = "";
  if (localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <b>{networkLocal && networkLocal.name}</b>.
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    try {
      const provider = await web3Modal.connect();
      setInjectedProvider(new Web3Provider(provider));
    } catch (error) {
      console.log("Error connecting to wallet:", error);
    }
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal && web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  // Add event listeners for ethereum provider
  useEffect(() => {
    // Safely handle Ethereum provider events
    const handleChainChanged = () => {
      if (web3Modal && web3Modal.cachedProvider) {
        setTimeout(() => window.location.reload(), 1);
      }
    };

    const handleAccountsChanged = () => {
      if (web3Modal && web3Modal.cachedProvider) {
        setTimeout(() => window.location.reload(), 1);
      }
    };

    // Check if ethereum provider exists and attach listeners safely
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        window.ethereum.on("chainChanged", handleChainChanged);
        window.ethereum.on("accountsChanged", handleAccountsChanged);
      } catch (error) {
        console.log("Error setting up ethereum listeners:", error);
      }

      // Clean up event listeners on unmount
      return () => {
        if (window.ethereum) {
          try {
            window.ethereum.removeListener("chainChanged", handleChainChanged);
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          } catch (error) {
            console.log("Error removing ethereum listeners:", error);
          }
        }
      };
    }
  }, []);

  const faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name === "localhost";

  const [faucetClicked, setFaucetClicked] = useState(false);

  const [transferToAddresses, setTransferToAddresses] = useState({});

  const [noTokensForFreeMint, setNoTokensForFreeMint] = useState(0);

  return (
    <div className="App">
      {/* Network display is outside the router */}
      {networkDisplay}

      <Router>
        {/* Header and MintInfo are now inside the Router */}
        <Header />
        <MintInfo totalSupply />
        <Switch>
          <Route exact path="/">
            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

            <div id={"controls"} style={{ maxWidth: 820, margin: "auto", marginTop: 32, padding: "0 0 32px 0" }}>
              {isSigner ? (
                <>
                  {isFreeMintEligible && freeMintsRemaining && freeMintsRemaining.toString() > 0 ? (
                    <>
                      {" "}
                      {/* <form>
                        <label htmlFor="freeMintInput">mint for free:</label>
                        <input
                          type="text"
                          id="freeMintInput"
                          name="freeMintInput"
                          style={{
                            color: "black",
                          }}
                          onChange={e => setNoTokensForFreeMint(e.target.value)}
                        ></input>
                      </form> */}
                      <button
                        style={{
                          margin: "30px",
                          color: "black",
                          padding: "10px 30px 10px 30px",
                          fontSize: "20px",
                          fontFamily: "monospace",
                          cursor: "pointer",
                        }}
                        onClick={e => {
                          const newValue = Math.max(0, noTokensForFreeMint - 1);
                          console.log(`>>> minus button. old value: ${noTokensForFreeMint}. new value: ${newValue}`);
                          setNoTokensForFreeMint(newValue);
                        }}
                      >
                        -
                      </button>
                      <button
                        style={{
                          margin: "30px",
                          color: "black",
                          padding: "10px 30px 10px 30px",
                          fontSize: "20px",
                          fontFamily: "monospace",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          tx(writeContracts.G4m3.mintFreeGated(noTokensForFreeMint));
                        }}
                      >
                        mint free ({noTokensForFreeMint} of {freeMintsRemaining.toString()})
                      </button>
                      <button
                        style={{
                          margin: "30px",
                          color: "black",
                          padding: "10px 30px 10px 30px",
                          fontSize: "20px",
                          fontFamily: "monospace",
                          cursor: "pointer",
                        }}
                        onClick={e => {
                          const newValue = Math.min(freeMintsRemaining.toString(), noTokensForFreeMint + 1);
                          console.log(`>>> plus button. old value: ${noTokensForFreeMint}. new value: ${newValue}`);
                          setNoTokensForFreeMint(newValue);
                        }}
                      >
                        +
                      </button>
                    </>
                  ) : (
                    <></>
                  )}
                  <button
                    style={{
                      margin: "30px",
                      color: "black",
                      padding: "10px 30px 10px 30px",
                      fontSize: "20px",
                      fontFamily: "monospace",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      tx(writeContracts.G4m3.mintItem(address, { value: parseEther("0.02") }));
                    }}
                  >
                    mint one
                  </button>
                  <button
                    style={{
                      margin: "30px",
                      color: "black",
                      padding: "10px 30px 10px 30px",
                      fontSize: "20px",
                      fontFamily: "monospace",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      tx(writeContracts.G4m3.mintPack(address, { value: parseEther("0.05") }));
                    }}
                  >
                    mint pack (5 tokens)
                  </button>
                </>
              ) : (
                <button
                  style={{
                    margin: "30px",
                    color: "black",
                    padding: "10px 30px 10px 30px",
                    fontSize: "20px",
                    fontFamily: "monospace",
                  }}
                  onClick={loadWeb3Modal}
                >
                  connect
                </button>
              )}
            </div>

            <div style={{ maxWidth: 820, margin: "auto", padding: "0 16px 256px 16px" }}>
              <Row gutter={[16, 16]}>
                {yourCollectibles && yourCollectibles.length > 0 ? (
                  // When we have collectibles to show
                  yourCollectibles.map((c, icx) => {
                    return (
                      <Col xs={24} md={12} lg={12} key={`collectible-${icx}`}>
                        <ItemCard
                          item={c}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          transferToAddresses={transferToAddresses}
                          setTransferToAddresses={setTransferToAddresses}
                          writeContracts={writeContracts}
                          tx={tx}
                          address={address}
                        />
                      </Col>
                    );
                  })
                ) : (
                  // Loading or no collectibles
                  <Col span={24} style={{ fontFamily: "monospace", textAlign: "center", padding: "40px 0 40px 0" }}>
                    {/* Different loading states */}
                    {collectionLoadingState === "checking" ? (
                      <div>Checking your collection...</div>
                    ) : collectionLoadingState === "loading" ? (
                      <div>Loading your {detectedCollectibles} collectibles...</div>
                    ) : (
                      // Only show "no collectibles" when we're done loading and confirmed none exist
                      <div>You don't have any collectibles yet. Try minting some!</div>
                    )}
                  </Col>
                )}
              </Row>
            </div>
            <div
              style={{ maxWidth: 820, margin: "auto", marginTop: 32, padding: "0 0 256px 0", fontFamily: "monospace" }}
            >
              🛠 built with{" "}
              <a href="https://github.com/austintgriffith/scaffold-eth" target="_blank">
                🏗 scaffold-eth
              </a>
              🍴{" "}
              <a href="https://github.com/austintgriffith/scaffold-eth" target="_blank">
                Fork this repo
              </a>{" "}
              and build a cool SVG NFT!
            </div>
          </Route>
          <Route path="/gallery">
            <Gallery
              allCollectibles={
                fullGallery ? 
                // Combine all loaded chunks into a single array and remove duplicates by ID
                Array.from(new Map(
                  Object.keys(fullGallery)
                    .flatMap(key => fullGallery[key] || [])
                    .map(item => [item.id, item]) // Use id as the key
                ).values())
                : []
              }
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              transferToAddresses={transferToAddresses}
              setTransferToAddresses={setTransferToAddresses}
              writeContracts={writeContracts}
              tx={tx}
              address={address}
              totalSupply={totalSupply}
              setGalleryLoadRange={setGalleryLoadRange}
              isLoadingGallery={isLoadingGallery && !maxChunksLoaded}
              loadProgress={totalSupply ? Math.min(100, (currentChunk * CHUNK_SIZE * 100) / totalSupply.toNumber()) : 0}
              galleryLoadRange={galleryLoadRange}
            />
          </Route>
          <Route path="/debug">
            {/* Remove inline style and use just a simple div */}
            <div className="debug-container">
              <Address value={readContracts && readContracts.G4m3 && readContracts.G4m3.address} />
            </div>

            <Contract
              name="G4m3"
              signer={userProvider.getSigner()}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route>
        </Switch>
      </Router>

      {/* Commented out UI components removed */}
    </div>
  );
}

export default App;
