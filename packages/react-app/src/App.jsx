import { StaticJsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { formatEther, parseEther } from "@ethersproject/units";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Col, Row } from "antd";
import "antd/dist/antd.css";
import { useUserAddress } from "eth-hooks";
import React, { useCallback, useEffect, useState } from "react";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Address, Contract, Header, ItemCard, Gallery, MintInfo } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useUserProvider,
} from "./hooks";
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
const localProvider = new StaticJsonRpcProvider(localProviderUrlFromEnv);

// Block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
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
});

function App(props) {
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
  if (balance) {
    console.log("🤗 balance:", balance.toString());
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

  // track total supply
  const totalSupply = useContractReader(readContracts, "G4m3", "totalSupply", [address], DEFAULT_POLL_TIME);

  // 📟 Listen for broadcast events
  // const transferEvents = useEventListener(readContracts, "G4m3", "Transfer", localProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  //
  // State for NFT collections
  //
  const yourBalance = balance && balance.toNumber && balance.toNumber();
  const [yourCollectibles, setYourCollectibles] = useState();
  const [fullGallery, setFullGallery] = useState();
  const [galleryLoadRange, setGalleryLoadRange] = useState([1, 10]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);

  useEffect(() => {
    // new update your collectibles approach in two steps: 1) get owner's token IDs, 2) get tokenURIs for all IDs
    const updateOwenersCollectibles = async () => {
      try {
        if (!readContracts || !readContracts.G4m3 || !address || !balance) {
          console.log("Missing required data to load collectibles");
          return;
        }
        
        console.log("Loading collectibles for", address, "with balance", balance.toString());
        setIsLoadingCollection(true);
        
        // Alternative approach: scan all tokens and check ownership
        const totalSupply = await readContracts.G4m3.totalSupply();
        console.log("Total supply:", totalSupply.toString());
        
        const ownedTokenIds = [];
        for (let i = 1; i <= totalSupply.toNumber(); i++) {
          try {
            const owner = await readContracts.G4m3.ownerOf(i);
            if (owner.toLowerCase() === address.toLowerCase()) {
              ownedTokenIds.push(i);
              console.log("Found owned token:", i);
            }
          } catch (error) {
            console.log("Error checking token", i, error);
          }
        }
        
        console.log("Found owned tokens:", ownedTokenIds);
        
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
              console.log("JSON manifest string:", jsonManifestString);
              const jsonManifest = JSON.parse(jsonManifestString);
              return { id: ownedTokenIds[idx], uri: u, owner: address, ...jsonManifest };
            });

            console.log(">>> gonna update collectibles:", collectibleUpdate);
            setYourCollectibles(collectibleUpdate.reverse());
            console.log(">>> updating owner collectibles: END");
          } catch (error) {
            console.log("error parsing collectible URIs: ", error);
            console.log(">>> updating owner collectibles: ERROR");
          }
        } else {
          console.log("No tokens owned by this address");
        }
      } catch (error) {
        console.log("Error loading collectibles:", error);
      } finally {
        setIsLoadingCollection(false);
      }
    };
    
    // re-activate to show owner's collection
    updateOwenersCollectibles();
  }, [address, yourBalance, readContracts]);

  // load all tokens into state
  useEffect(() => {
    const updateGallery = async () => {
      console.log(`new range to query: ${galleryLoadRange[0]}-${galleryLoadRange[1]}`);
      try {
        if (!readContracts || !readContracts.G4m3) {
          console.log("Contracts not loaded yet");
          return;
        }
        
        const tokenUriPromises = [];
        const validTokenIds = [];
        
        // First check if tokens exist
        for (let i = galleryLoadRange[0]; i <= galleryLoadRange[1]; i++) {
          try {
            // Check if token exists by trying to get the owner
            await readContracts.G4m3.ownerOf(i);
            validTokenIds.push(i);
            tokenUriPromises.push(readContracts.G4m3.tokenURI(i));
          } catch (error) {
            console.log(`Token ${i} does not exist or other error:`, error.message);
          }
        }

        if (validTokenIds.length === 0) {
          console.log("No valid tokens found in the range");
          return;
        }

        const allURIs = await Promise.all(tokenUriPromises);
        console.log("Gallery URIs:", allURIs);
        
        try {
          // trying to parse URIs
          const galleryUpdate = allURIs.map((u, idx) => {
            const jsonManifestString = atob(u.substring(29));
            const jsonManifest = JSON.parse(jsonManifestString);
            return { id: validTokenIds[idx], uri: u, owner: address, ...jsonManifest };
          });
          // commit to state
          setFullGallery(galleryUpdate);
          console.log("Gallery updated with", galleryUpdate.length, "tokens");
        } catch (error) {
          console.log("error updating gallery collectibles: ", error);
        }
      } catch (err) {
        console.log("error updating gallery: ", err);
      }
    };

    if (readContracts && readContracts.G4m3) {
      updateGallery();
    }
  }, [totalSupply, galleryLoadRange, readContracts]);

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
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name === "localhost";

  const [faucetClicked, setFaucetClicked] = useState(false);

  const [transferToAddresses, setTransferToAddresses] = useState({});

  const [noTokensForFreeMint, setNoTokensForFreeMint] = useState(0);

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      <MintInfo totalSupply />
      {networkDisplay}

      <Router>
        <Switch>
          <Route exact path="/">
            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

            <div id={"controls"} style={{ maxWidth: 820, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
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

            <div
              style={{ maxWidth: 820, margin: "auto", paddingBottom: 256, paddingLeft: "16px", paddingRight: "16px" }}
            >
              <Row gutter={[16, 16]}>
                {yourCollectibles ? (
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
                ) : isLoadingCollection ? (
                  <Col span={24} style={{ fontFamily: "monospace" }}>
                    loading your {balance.toString()} collectibles
                  </Col>
                ) : (
                  <Col span={24} style={{ fontFamily: "monospace" }}>
                    no collectibles
                  </Col>
                )}
              </Row>
            </div>
            <div style={{ maxWidth: 820, margin: "auto", marginTop: 32, paddingBottom: 256, fontFamily: "monospace" }}>
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
              allCollectibles={fullGallery}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              transferToAddresses={transferToAddresses}
              setTransferToAddresses={setTransferToAddresses}
              writeContracts={writeContracts}
              tx={tx}
              address={address}
              totalSupply={totalSupply}
              setGalleryLoadRange={setGalleryLoadRange}
            />
          </Route>
          <Route path="/debug">
            <div style={{ padding: 32 }}>
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

// Add event listeners for chain and account changes to refresh the UI
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on("chainChanged", () => {
    if (web3Modal.cachedProvider) {
      setTimeout(() => window.location.reload(), 1);
    }
  });

  window.ethereum.on("accountsChanged", () => {
    if (web3Modal.cachedProvider) {
      setTimeout(() => window.location.reload(), 1);
    }
  });
}

export default App;
