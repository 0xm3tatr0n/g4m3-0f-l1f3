import { StaticJsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { formatEther, parseEther, parseUnits } from "@ethersproject/units";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Col, Row } from "antd";
import "antd/dist/antd.css";
import { useUserAddress } from "eth-hooks";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
// import assets from "./assets.js";
import { Account, Address, AddressInput, Contract, GasGauge, Header, ItemCard, Gallery, MintInfo } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useEventListener,
  useExchangePrice,
  useExternalContractLoader,
  useGasPrice,
  useOnBlock,
  useUserProvider,
} from "./hooks";

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
// const ipfsAPI = require("ipfs-http-client");

// const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

// console.log("📦 Assets: ", assets);

/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = process.env.REACT_APP_BUILD_ENV === "production" ? NETWORKS.mumbai : NETWORKS.localhost; // NETWORKS.mumbai; // NETWORKS.localhost <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)
console.log(">>> selected target network: ");
console.log(targetNetwork);
// 😬 Sorry for all the console logging
const DEBUG = true;

// helper function to "Get" from IPFS
// you usually go content.toString() after this...
// const getFromIPFS = async hashToGet => {
//   for await (const file of ipfs.get(hashToGet)) {
//     console.log(file.path);
//     if (!file.content) continue;
//     const content = new BufferList();
//     for await (const chunk of file.content) {
//       content.append(chunk);
//     }
//     console.log(content);
//     return content;
//   }
// };

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = null; // new StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544");
const mainnetInfura = new StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
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
  // log some version referrence for double-checking
  console.log("### version: 4");
  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;

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
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId = userProvider && userProvider._network && userProvider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  // const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const isSigner = injectedProvider && injectedProvider.getSigner && injectedProvider.getSigner()._isSigner;
  // // If you want to call a function on a new block
  // useOnBlock(mainnetProvider, () => {
  //   console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  // });

  // Then read your DAI balance like:
  /*
  const myMainnetDAIBalance = useContractReader({ DAI: mainnetDAIContract }, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]); */

  // keep track of a variable from the contract in the local React state:
  const balance = useContractReader(readContracts, "G4m3", "balanceOf", [address]);
  if (balance) {
    console.log("🤗 balance:", balance.toString());
  }
  // console.log(">>> reading free mint eligibility for", address);
  const isFreeMintEligible = useContractReader(readContracts, "G4m3", "isEligibleForFreeMint", [address]);
  const freeMintsRemaining = useContractReader(readContracts, "G4m3", "freeMintsRemaining", [address]);

  // track total supply
  const totalSupply = useContractReader(readContracts, "G4m3", "totalSupply");

  // 📟 Listen for broadcast events
  // const transferEvents = useEventListener(readContracts, "G4m3", "Transfer", localProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const yourBalance = balance && balance.toNumber && balance.toNumber();
  // console.log(">>> yourBallance: ", yourBalance);
  const [yourCollectibles, setYourCollectibles] = useState();
  const [fullGallery, setFullGallery] = useState();
  const [galleryLoadRange, setGalleryLoadRange] = useState([1, 10]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);

  useEffect(() => {
    console.log(">>> is loading collection changed: ", isLoadingCollection);
  }, [isLoadingCollection]);

  useEffect(() => {
    console.log(">>> providers changed: ");
    console.log(">>> injectedProvider", injectedProvider);
    console.log(">>> localProvider", localProvider);
    console.log(">>> userProvider", userProvider);
    console.log(">>> mainnetProvider", mainnetProvider);
  }, [injectedProvider, localProvider, userProvider, mainnetProvider]);

  useEffect(() => {
    // new update your collectibles approach in two steps: 1) get owner's token IDs, 2) get tokenURIs for all IDs
    const updateOwenersCollectibles = async () => {
      const collectibleIdPromises = [];
      for (let i = 0; i < balance; i++) {
        collectibleIdPromises.push(readContracts.G4m3.tokenOfOwnerByIndex(address, i));
      }

      const ids = await Promise.all(collectibleIdPromises);

      // check if any collectibles owned
      if (ids.length > 0) {
        console.log(">>> updating owner collectibles: START");
        setIsLoadingCollection(true);
        // console.log(">>> trying to update collectibles now ");
        const uriPromises = [];
        ids.forEach(e => {
          uriPromises.push(readContracts.G4m3.tokenURI(e));
        });

        const uris = await Promise.all(uriPromises);
        // console.log(">>> habemus URIs: ", uris);

        try {
          // trying to parse URIs
          const collectibleUpdate = uris.map((u, idx) => {
            const jsonManifestString = atob(u.substring(29));
            // console.log(jsonManifestString);
            const jsonManifest = JSON.parse(jsonManifestString);
            return { id: ids[idx], uri: u, owner: address, ...jsonManifest };
          });

          // console.log(">>> gonna update collectibles: ", collectibleUpdate);
          setYourCollectibles(collectibleUpdate.reverse());
          console.log(">>> updating owner collectibles: END");
          setIsLoadingCollection(false);
        } catch (error) {
          console.log("error updating your collectibles: ", error);
          console.log(">>> updating owner collectibles: ERROR");
        }
      }
    };
    // re-activate to show owner's collection
    updateOwenersCollectibles();
  }, [address, yourBalance]);

  // load all tokens into state
  useEffect(() => {
    const updateGallery = async () => {
      console.log(`new range to query: ${galleryLoadRange[0]}-${galleryLoadRange[1]}`);
      try {
        //
        const tokenUriPromises = [];
        for (let i = galleryLoadRange[0]; i <= galleryLoadRange[1]; i++) {
          // push promises to array so they can be called together
          tokenUriPromises.push(readContracts.G4m3.tokenURI(i));
        }

        const allURIs = await Promise.all(tokenUriPromises);
        try {
          // trying to parse URIs
          const galleryUpdate = allURIs.map((u, idx) => {
            const jsonManifestString = atob(u.substring(29));
            const jsonManifest = JSON.parse(jsonManifestString);
            return { id: idx, uri: u, owner: address, ...jsonManifest };
          });
          // commit to state
          setFullGallery(galleryUpdate);
        } catch (error) {
          console.log("error updating your collectibles: ", error);
        }
      } catch (err) {
        console.log("error updating gallery: ", err);
      }
    };

    // updateGallery();
  }, [totalSupply, galleryLoadRange]);

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
      yourMainnetBalance &&
      readContracts &&
      writeContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      // console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? formatEther(yourMainnetBalance) : "...");
      // console.log("📝 readContracts", readContracts);
      // console.log("🔐 writeContracts", writeContracts);
      console.log("🏃‍♀️ is eligible for free mint ", isFreeMintEligible);
      if (freeMintsRemaining && freeMintsRemaining.toString()) {
        console.log("🏃‍♀️ free mints remaining ", freeMintsRemaining.toString());
      }
    }
  }, [mainnetProvider, address, selectedChainId, yourLocalBalance, yourMainnetBalance, readContracts, writeContracts]);

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

  const [sending, setSending] = useState();
  const [ipfsHash, setIpfsHash] = useState();
  const [ipfsDownHash, setIpfsDownHash] = useState();

  const [downloading, setDownloading] = useState();
  const [ipfsContent, setIpfsContent] = useState();

  const [transferToAddresses, setTransferToAddresses] = useState({});

  const [loadedAssets, setLoadedAssets] = useState();

  const galleryList = [];

  const [noTokensForFreeMint, setNoTokensForFreeMint] = useState(0);

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      <MintInfo totalSupply />
      {/* {networkDisplay} */}

      <BrowserRouter>
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
              setTranferToAddresses={setTransferToAddresses}
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
      </BrowserRouter>

      {/* <ThemeSwitch /> */}

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      {/* <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userProvider={userProvider}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
          isSigner={isSigner}
        />
        {faucetHint}
      </div> */}
      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      {/* <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              // if the local provider has a signer, let's show the faucet:
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div> */}
    </div>
  );
}

/* eslint-disable */
window.ethereum &&
  window.ethereum.on("chainChanged", chainId => {
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1);
  });

window.ethereum &&
  window.ethereum.on("accountsChanged", accounts => {
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1);
  });
/* eslint-enable */

export default App;
