import React, { useState } from "react";
import { Row, Col, Typography, Button, Card, Divider, Space, Spin } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import SectionNavigation from "./SectionNavigation";
import AnimationModal from "./AnimationModal";

const { Title, Paragraph, Text } = Typography;

// CSS Styles
const styles = {
  section: {
    padding: "60px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: "40px",
    fontFamily: "monospace",
  },
  sectionSubtitle: {
    textAlign: "center",
    marginBottom: "24px",
    fontFamily: "monospace",
    fontWeight: "normal",
    color: "#888",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  galleryContainer: {
    overflow: "auto",
    height: "calc(70vh)",
    width: "100%",
    border: "1px solid #333",
    borderRadius: "8px",
    margin: "16px 0",
    padding: "16px",
    background: "#0e0e0e",
  },
  galleryInner: {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    minHeight: "100%",
  },
  epochColumn: {
    display: "flex",
    flexDirection: "column",
    width: "150px",
    gap: "10px",
    alignItems: "center",
  },
  epochTitle: {
    fontFamily: "monospace",
    color: "#fff",
    position: "sticky",
    top: 0,
    background: "#111",
    width: "100%",
    padding: "8px 0",
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "14px",
    textAlign: "center",
    zIndex: 10,
  },
  animateButton: {
    position: "absolute",
    top: "12px",
    right: "12px",
    zIndex: 2,
  },
};

function IntroSection() {
  return (
    <div id="intro-section" style={styles.section}>
      <div style={styles.container}>
        <Row justify="center" align="middle" gutter={[24, 40]}>
          <Col xs={24}>
            <div>
              <Title level={1} style={styles.sectionTitle}>
                g4m3 0f l1f3 NFTs
              </Title>
              <Paragraph style={{ fontSize: "18px", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
                A collection of generative art based on Conway's cellular automaton.
                Each token evolves following automaton rules, creating unique and fascinating patterns.
              </Paragraph>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

function MintSection({ 
  tx, 
  writeContracts, 
  address, 
  loadWeb3Modal, 
  isSigner, 
  isFreeMintEligible,
  freeMintsRemaining,
  noTokensForFreeMint,
  setNoTokensForFreeMint,
  parseEther
}) {
  return (
    <div id="mint-section" style={{ ...styles.section, background: "#111" }}>
      <div style={styles.container}>
        <Title level={2} style={styles.sectionTitle}>
          Mint Your NFT
        </Title>
        <Title level={4} style={styles.sectionSubtitle}>
          Create your own generative g4m3 0f l1f3 collectible
        </Title>

        <Row justify="center">
          <Col xs={24} md={18} lg={14}>
            <Card 
              style={{ 
                background: "#1a1a1a", 
                borderRadius: "12px",
                border: "1px solid #333"
              }}
            >
              <div style={{ textAlign: "center" }}>
                {isSigner ? (
                  <>
                    {isFreeMintEligible && freeMintsRemaining && freeMintsRemaining.toString() > 0 ? (
                      <div style={{ marginBottom: "30px" }}>
                        <Title level={4} style={{ fontFamily: "monospace", color: "#26abd4" }}>
                          Free Mints Available: {freeMintsRemaining.toString()}
                        </Title>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#1f1f1f",
                            borderRadius: "8px",
                            border: "1px solid #333",
                            padding: "5px"
                          }}>
                            <Button
                              type="primary"
                              ghost
                              style={{
                                height: "40px",
                                width: "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                                fontFamily: "monospace",
                                padding: 0
                              }}
                              onClick={e => {
                                const newValue = Math.max(0, noTokensForFreeMint - 1);
                                setNoTokensForFreeMint(newValue);
                              }}
                            >
                              -
                            </Button>
                            <div style={{
                              padding: "0 15px",
                              fontSize: "18px",
                              fontFamily: "monospace",
                              color: "#fff",
                              minWidth: "40px",
                              textAlign: "center"
                            }}>
                              {noTokensForFreeMint}
                            </div>
                            <Button
                              type="primary"
                              ghost
                              style={{
                                height: "40px",
                                width: "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                                fontFamily: "monospace",
                                padding: 0
                              }}
                              onClick={e => {
                                const newValue = Math.min(freeMintsRemaining.toString(), noTokensForFreeMint + 1);
                                setNoTokensForFreeMint(newValue);
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <Button
                          type="primary"
                          size="large"
                          style={{
                            padding: "10px 30px",
                            height: "auto",
                            fontSize: "18px",
                            fontFamily: "monospace",
                            background: "#26abd4",
                            borderColor: "#26abd4"
                          }}
                          onClick={() => {
                            tx(writeContracts.G4m3.mintFreeGated(noTokensForFreeMint));
                          }}
                        >
                          Mint Free ({noTokensForFreeMint} of {freeMintsRemaining.toString()})
                        </Button>
                      </div>
                    ) : null}
                    
                    <Divider style={{ borderColor: "#333" }} />
                    
                    <Space size="large" wrap style={{ justifyContent: "center" }}>
                      <Button
                        type="primary"
                        size="large"
                        style={{
                          padding: "10px 30px",
                          height: "auto",
                          fontSize: "18px",
                          fontFamily: "monospace",
                        }}
                        onClick={() => {
                          tx(writeContracts.G4m3.mintItem(address, { value: parseEther("0.02") }));
                        }}
                      >
                        Mint One (0.02 ETH)
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        style={{
                          padding: "10px 30px",
                          height: "auto",
                          fontSize: "18px",
                          fontFamily: "monospace",
                          background: "#26abd4",
                          borderColor: "#26abd4"
                        }}
                        onClick={() => {
                          tx(writeContracts.G4m3.mintPack(address, { value: parseEther("0.05") }));
                        }}
                      >
                        Mint Pack (5 tokens - 0.05 ETH)
                      </Button>
                    </Space>
                  </>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      padding: "10px 40px",
                      height: "auto",
                      fontSize: "18px",
                      fontFamily: "monospace"
                    }}
                    onClick={loadWeb3Modal}
                  >
                    Connect Wallet to Mint
                  </Button>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

function MyItemsSection({ 
  yourCollectibles, 
  isLoadingCollection, 
  mainnetProvider, 
  blockExplorer,
  transferToAddresses, 
  setTransferToAddresses, 
  writeContracts, 
  tx, 
  address, 
  ItemCard 
}) {
  return (
    <div id="my-items-section" style={styles.section}>
      <div style={styles.container}>
        <Title level={2} style={styles.sectionTitle}>
          My Collection
        </Title>
        <Title level={4} style={styles.sectionSubtitle}>
          Your g4m3 0f l1f3 NFTs
        </Title>

        <Row gutter={[16, 16]}>
          {isLoadingCollection ? (
            <Col span={24} style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: "20px", fontFamily: "monospace" }}>
                Loading your collection...
              </div>
            </Col>
          ) : yourCollectibles && yourCollectibles.length > 0 ? (
            // When we have collectibles to show
            yourCollectibles.map((item, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={`collectible-${index}`}>
                <ItemCard
                  item={item}
                  ensProvider={mainnetProvider}
                  blockExplorer={blockExplorer}
                  transferToAddresses={transferToAddresses}
                  setTransferToAddresses={setTransferToAddresses}
                  writeContracts={writeContracts}
                  tx={tx}
                  address={address}
                />
              </Col>
            ))
          ) : (
            // No collectibles
            <Col span={24} style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontFamily: "monospace", fontSize: "16px" }}>
                You don't have any collectibles yet. Try minting some!
              </div>
              <Button
                type="primary"
                style={{ marginTop: "20px" }}
                onClick={() => document.getElementById('mint-section').scrollIntoView({ behavior: 'smooth' })}
              >
                Go to Mint Section
              </Button>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
}

function GallerySection({ 
  allCollectibles, 
  isLoadingGallery, 
  loadProgress, 
  ItemCard 
}) {
  const [animationModalVisible, setAnimationModalVisible] = useState(false);
  const [selectedEpoch, setSelectedEpoch] = useState(null);

  // Group by epoch
  const collectiblesByEpoch = React.useMemo(() => {
    if (!allCollectibles || allCollectibles.length === 0) return {};

    const result = {};

    allCollectibles.forEach(item => {
      if (!item.attributes) return;
      
      // Find epoch
      const epochAttr = item.attributes.find(attr => attr.trait_type === "epoch");
      if (epochAttr) {
        const epoch = epochAttr.value.replace('#', '');
        
        if (!result[epoch]) {
          result[epoch] = [];
        }
        
        result[epoch].push(item);
      }
    });

    // Sort tokens within each epoch by generation
    Object.keys(result).forEach(epoch => {
      result[epoch].sort((a, b) => {
        const getGeneration = item => {
          const genAttr = item.attributes?.find(attr => attr.trait_type === "generation");
          return genAttr ? parseInt(genAttr.value.replace('#', '')) : 0;
        };
        
        return getGeneration(a) - getGeneration(b);
      });
    });

    return result;
  }, [allCollectibles]);

  // Function to calculate zoom level based on available space
  const getCardSize = () => {
    return 150; // Default size
  };

  // Open animation modal for a specific epoch
  const openAnimationModal = (epoch) => {
    setSelectedEpoch(epoch);
    setAnimationModalVisible(true);
  };

  return (
    <div id="gallery-section" style={{ ...styles.section, background: "#111", paddingBottom: "80px" }}>
      <div style={styles.container}>
        <Title level={2} style={styles.sectionTitle}>
          Gallery
        </Title>
        <Title level={4} style={styles.sectionSubtitle}>
          Explore all g4m3 0f l1f3 NFTs by epoch
        </Title>

        {isLoadingGallery ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: "20px", fontFamily: "monospace" }}>
              Loading gallery... {Math.round(loadProgress)}%
            </div>
          </div>
        ) : Object.keys(collectiblesByEpoch).length > 0 ? (
          // Column layout like the original Gallery
          <div style={styles.galleryContainer}>
            <div style={styles.galleryInner}>
              {/* Create a column for each epoch */}
              {Object.keys(collectiblesByEpoch)
                .sort((a, b) => Number(a) - Number(b))
                .map(epoch => (
                  <div key={`epoch-${epoch}`} style={styles.epochColumn}>
                    <h3 style={styles.epochTitle}>
                      Epoch {epoch}
                      <Button
                        type="link"
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => openAnimationModal(epoch)}
                        style={{ 
                          position: "absolute", 
                          right: 5, 
                          top: 5, 
                          color: "#26abd4",
                          padding: "0 4px" 
                        }}
                      />
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", width: "100%" }}>
                      {collectiblesByEpoch[epoch].map((item, idx) => (
                        <div key={`token-${item.id}`} style={{ width: getCardSize(), height: getCardSize() }}>
                          <ItemCard
                            item={item}
                            zoomLevel={2} // Small cards in gallery view
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          // No tokens
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontFamily: "monospace", fontSize: "16px" }}>
              No tokens found in the gallery. Try extracting or minting some tokens.
            </div>
          </div>
        )}
        
        {/* Animation Modal */}
        <AnimationModal
          visible={animationModalVisible}
          onClose={() => setAnimationModalVisible(false)}
          allCollectibles={allCollectibles}
          initialEpoch={selectedEpoch}
        />
      </div>
    </div>
  );
}

function SinglePageApp(props) {
  const { 
    yourCollectibles,
    mainnetProvider,
    blockExplorer,
    transferToAddresses,
    setTransferToAddresses,
    writeContracts,
    tx,
    address,
    totalSupply,
    isLoadingGallery,
    loadProgress,
    loadWeb3Modal,
    isSigner,
    isFreeMintEligible,
    freeMintsRemaining,
    noTokensForFreeMint,
    setNoTokensForFreeMint,
    parseEther,
    ItemCard,
    allCollectibles,
    isLoadingCollection
  } = props;

  return (
    <div>
      <SectionNavigation />
      
      <IntroSection />
      
      <MintSection 
        tx={tx}
        writeContracts={writeContracts}
        address={address}
        loadWeb3Modal={loadWeb3Modal}
        isSigner={isSigner}
        isFreeMintEligible={isFreeMintEligible}
        freeMintsRemaining={freeMintsRemaining}
        noTokensForFreeMint={noTokensForFreeMint}
        setNoTokensForFreeMint={setNoTokensForFreeMint}
        parseEther={parseEther}
      />
      
      <MyItemsSection 
        yourCollectibles={yourCollectibles}
        isLoadingCollection={isLoadingCollection}
        mainnetProvider={mainnetProvider}
        blockExplorer={blockExplorer}
        transferToAddresses={transferToAddresses}
        setTransferToAddresses={setTransferToAddresses}
        writeContracts={writeContracts}
        tx={tx}
        address={address}
        ItemCard={ItemCard}
      />
      
      <GallerySection 
        allCollectibles={allCollectibles}
        isLoadingGallery={isLoadingGallery}
        loadProgress={loadProgress}
        ItemCard={ItemCard}
      />
    </div>
  );
}

export default SinglePageApp;