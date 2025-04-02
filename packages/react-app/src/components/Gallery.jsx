import React, { useEffect, useState, useMemo } from "react";
import { Col, Row, Slider, Spin, Progress } from "antd";
import { ItemCard } from ".";

const defaultStats = { totalSupply: 0, latestGen: "n/a" };

// Stats component
function Stats(props) {
  const { collectibles, totalSupply } = props;

  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    // for now: single function to consolidate stats
    const generateStats = async () => {
      if (!collectibles || collectibles.length === 0) {
        setStats(defaultStats);
        return;
      }
      
      try {
        const latestGen = collectibles.reduce((accumulator, currentValue) => {
          const attributes = currentValue.attributes || [];
          const genAttribute = attributes.find(e => {
            return e.trait_type === "generation";
          });
          const gen = genAttribute ? Number(genAttribute.value.replace("#", "")) : 0;
          return Math.max(gen, accumulator);
        }, 0);
        
        // stats object
        const newStats = {
          totalSupply: collectibles.length,
          latestGen,
        };
        
        setStats(newStats);
      } catch (error) {
        console.log("Error generating stats:", error);
        setStats(defaultStats);
      }
    };

    generateStats();
  }, [collectibles]);

  return (
    <Col span={24}>
      <Row>
        <Col span={24}>Stats</Col>
      </Row>
      <Row>
        <Col span={12}>Total supply: {stats.totalSupply}</Col>
        <Col span={12}>Latest generation: {stats.latestGen}</Col>
      </Row>
    </Col>
  );
}

// Controls component
function GalleryControl(props) {
  const { zoomLevel, setZoomLevel, setGalleryLoadRange } = props;

  useEffect(() => {
    // No longer need to set initial range - this is now handled by the static token loading
  }, []);

  const onChangeZoom = newValue => {
    setZoomLevel(newValue);
  };
  
  // Function to clear cache and force reload
  const clearCacheAndReload = () => {
    // Clear localStorage cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('collectibles-') || key === 'gallery-cache') {
        localStorage.removeItem(key);
      }
    });
    
    // Force reload the page
    window.location.reload();
  };

  return (
    <Col span={24}>
      <Row gutter={16} align="middle">
        <Col span={16}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px', fontFamily: 'monospace' }}>Zoom:</span>
            <Slider 
              min={1} 
              max={5} 
              onChange={onChangeZoom} 
              value={typeof zoomLevel === "number" ? zoomLevel : 0}
              style={{ flex: 1 }}
            />
          </div>
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <button 
            onClick={clearCacheAndReload}
            style={{
              padding: '8px 16px',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 'bold',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh All Tokens
          </button>
        </Col>
      </Row>
    </Col>
  );
}
function Gallery(props) {
  const {
    allCollectibles,
    mainnetProvider,
    blockExplorer,
    transferToAddresses,
    setTransferToAddresses,
    writeContracts,
    tx,
    address,
    totalSupply,
    setGalleryLoadRange,
    isLoadingGallery,
    loadProgress,
  } = props;

  const [zoomLevel, setZoomLevel] = useState(3);

  // Parse the zoom level to get the item size
  const parseZoom = zoomLevel => {
    // More consistent sizing with exact pixel values
    switch (zoomLevel) {
      case 1: return 60;  // Smallest size
      case 2: return 120;
      case 3: return 180;
      case 4: return 240;
      case 5: return 300; // Largest size
      default: return 120;
    }
  };

  // Group collectibles by epoch
  const collectiblesByEpoch = useMemo(() => {
    if (!allCollectibles || allCollectibles.length === 0) return {};
    
    // Group by epoch
    const grouped = {};
    
    allCollectibles.forEach(item => {
      // Extract epoch from attributes or name
      let epoch = "Unknown";
      
      if (item.attributes) {
        const epochAttr = item.attributes.find(attr => attr.trait_type === "epoch");
        if (epochAttr) {
          // Extract just the number from the epoch value (remove # if present)
          epoch = epochAttr.value.replace('#', '');
        }
      }
      
      // Try to extract from name if attributes don't have it
      if (epoch === "Unknown" && item.name) {
        const epochMatch = item.name.match(/(\d+)\/\d+/);
        if (epochMatch) {
          epoch = epochMatch[1];
        }
      }
      
      // For debugging
      if (epoch === "Unknown") {
        console.log("⚠️ Found token without epoch:", item);
      }
      
      // Initialize array if this epoch doesn't exist yet
      if (!grouped[epoch]) {
        grouped[epoch] = [];
      }
      
      // Add to the epoch group
      grouped[epoch].push(item);
    });
    
    // Helper function to extract generation and token ID from an item
    const getGenerationAndId = item => {
      let generation = 0;
      if (item.attributes) {
        const genAttr = item.attributes.find(attr => attr.trait_type === "generation");
        if (genAttr) {
          generation = parseInt(genAttr.value.replace('#', ''));
        }
      }
      // Use token ID as secondary sort key
      const tokenId = item.id ? parseInt(item.id) : 0;
      return { generation, tokenId };
    };
    
    // Sort items within each epoch by generation and token ID (ascending - lowest at top)
    Object.keys(grouped).forEach(epoch => {
      grouped[epoch].sort((a, b) => {
        const aInfo = getGenerationAndId(a);
        const bInfo = getGenerationAndId(b);
        
        // First sort by generation
        if (aInfo.generation !== bInfo.generation) {
          return aInfo.generation - bInfo.generation;
        }
        // If same generation, sort by token ID
        return aInfo.tokenId - bInfo.tokenId;
      });
    });
    
    return grouped;
  }, [allCollectibles]);

  return (
    <div style={{ maxWidth: '100%', margin: "auto", padding: "0 16px 32px 16px" }}>
      <Row gutter={16}>
        <GalleryControl
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          setGalleryLoadRange={setGalleryLoadRange}
        />
      </Row>
      <Row>
        <Stats collectibles={allCollectibles} totalSupply={totalSupply} />
      </Row>
      
      {/* Debug info */}
      <div style={{ background: '#222', color: '#aaa', fontFamily: 'monospace', fontSize: '12px', padding: '12px', marginBottom: '16px', borderRadius: '4px' }}>
        <div style={{ marginBottom: '8px', borderBottom: '1px solid #444', paddingBottom: '4px', color: '#fff', fontWeight: 'bold' }}>
          Gallery Stats
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div><span style={{color: '#00d0ff'}}>Total tokens:</span> {allCollectibles?.length || 0}</div>
          <div><span style={{color: '#00d0ff'}}>Epochs found:</span> {Object.keys(collectiblesByEpoch).length}</div>
          <div><span style={{color: '#00d0ff'}}>Supply:</span> {totalSupply?.toString() || 'Loading...'}</div>
        </div>
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap' }}>
          {Object.entries(collectiblesByEpoch)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([epoch, tokens]) => (
              <div key={epoch} style={{ 
                margin: '4px', 
                padding: '4px 8px', 
                background: '#333', 
                borderRadius: '4px',
                border: '1px solid #555'
              }}>
                <span style={{color: '#ffcc00'}}>Epoch {epoch}:</span> {tokens.length} tokens
              </div>
          ))}
        </div>
      </div>
      
      {/* Gallery with loading overlay */}
      <div style={{ position: 'relative' }}>
        {/* Loading overlay */}
        {isLoadingGallery && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 100, 
            background: 'rgba(0,0,0,0.7)', 
            padding: '16px',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Spin size="large" />
            <div style={{ fontFamily: 'monospace', marginTop: '8px' }}>
              Loading more tokens...
            </div>
            <Progress 
              percent={Math.round(loadProgress)} 
              status="active" 
              style={{ width: '80%' }} 
            />
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#aaa' }}>
              Displaying {allCollectibles.length} tokens so far
            </div>
          </div>
        )}
        
        {/* Gallery content */}
        <div style={{ 
          overflow: 'auto', 
          height: 'calc(100vh - 180px)', 
          width: '100%',
          border: '1px solid #333',
          borderRadius: '4px',
          margin: '16px 0',
          padding: '8px', // Reduced padding for more symmetry with inner gaps
          opacity: isLoadingGallery ? 0.7 : 1,
          transition: 'opacity 0.3s ease'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '8px', // Smaller, consistent gap
            minHeight: '100%',
            minWidth: Object.keys(collectiblesByEpoch).length * (parseZoom(zoomLevel) + 16) // Ensure horizontal scrolling works
          }}>
            {/* Debug info about collectibles */}
            {allCollectibles.length === 0 && (
              <div style={{
                width: '100%', 
                textAlign: 'center', 
                padding: '20px',
                background: '#222',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>
                <div style={{color: 'yellow', marginBottom: '10px'}}>No collectibles found to display</div>
                <div style={{fontSize: '12px', color: '#aaa'}}>(Check browser console for debug information)</div>
              </div>
            )}
            
            {Object.keys(collectiblesByEpoch).length > 0 ? (
              // Create a column for each epoch
              Object.keys(collectiblesByEpoch).sort((a, b) => Number(a) - Number(b)).map(epoch => (
                <div key={`epoch-${epoch}`} style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  width: parseZoom(zoomLevel),
                  gap: '8px', // Match the horizontal gap
                  alignItems: 'center'
                }}>
                  <h3 style={{ 
                    textAlign: 'center', 
                    fontFamily: 'monospace',
                    position: 'sticky',
                    top: 0,
                    background: '#111',
                    width: '100%',
                    padding: '4px 0', // Reduced padding for more symmetry
                    marginTop: 0,
                    marginBottom: '4px', // Small margin to separate from content
                    fontSize: '14px', // Smaller font size
                    zIndex: 10
                  }}>
                    Epoch {epoch}
                  </h3>
                  
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column', // Normal column direction to put lowest generations at top
                    gap: '8px', // Match the other gaps
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    {collectiblesByEpoch[epoch].map((item, idx) => (
                      <div key={`collectible-${epoch}-${idx}`} style={{
                        width: parseZoom(zoomLevel),
                        height: parseZoom(zoomLevel), // Ensure square dimensions
                        margin: 0 // Remove margin to rely on gap for spacing
                      }}>
                        <ItemCard
                          item={item}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          transferToAddresses={transferToAddresses}
                          setTransferToAddresses={setTransferToAddresses}
                          writeContracts={writeContracts}
                          tx={tx}
                          address={address}
                          zoomLevel={zoomLevel} // Pass zoom level to the card
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                width: '100%', 
                textAlign: 'center', 
                padding: '40px 0', 
                fontFamily: 'monospace' 
              }}>
                No collectibles found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gallery;
