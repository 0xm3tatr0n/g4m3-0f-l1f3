import React, { useEffect, useState, useRef } from "react";
import { Modal, Row, Col, Slider, Button, Space, Spin, Typography, Switch, Input } from "antd";
import { PlayCircleOutlined, PauseCircleOutlined, StepForwardOutlined, StepBackwardOutlined } from "@ant-design/icons";

const { Text } = Typography;

function AnimationModal(props) {
  const { 
    visible, 
    onClose, 
    allCollectibles, 
    initialEpoch = null 
  } = props;
  
  // State for animation control
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [speed, setSpeed] = useState(1000); // milliseconds between frames
  const [showDetails, setShowDetails] = useState(true);
  
  // We're now using initialEpoch directly instead of allowing it to be changed
  const selectedEpoch = initialEpoch;
  
  // Refs
  const animationRef = useRef(null);
  const tokensByEpoch = useRef({});
  const maxGeneration = useRef(0);
  
  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setIsPlaying(false);
      setCurrentGeneration(0);
    } else {
      // Stop animation when modal closes
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [visible]);
  
  // We no longer need the availableEpochs since we're using initialEpoch directly
  
  // Group tokens by epoch and generation
  useEffect(() => {
    if (!allCollectibles || allCollectibles.length === 0) return;
    
    const epochMap = {};
    let globalMaxGen = 0;
    
    allCollectibles.forEach(item => {
      if (!item.attributes) return;
      
      // Find epoch and generation attributes
      const epochAttr = item.attributes.find(attr => attr.trait_type === "epoch");
      const genAttr = item.attributes.find(attr => attr.trait_type === "generation");
      
      if (epochAttr && genAttr) {
        const epoch = epochAttr.value.replace('#', '');
        const generation = parseInt(genAttr.value.replace('#', ''));
        
        // Track max generation
        if (generation > globalMaxGen) {
          globalMaxGen = generation;
        }
        
        // Initialize epoch map if needed
        if (!epochMap[epoch]) {
          epochMap[epoch] = {};
        }
        
        // Add token to epoch and generation
        if (!epochMap[epoch][generation]) {
          epochMap[epoch][generation] = [];
        }
        
        epochMap[epoch][generation].push(item);
      }
    });
    
    tokensByEpoch.current = epochMap;
    maxGeneration.current = globalMaxGen;
    
    // Since we're using initialEpoch directly, we don't need to handle epoch selection anymore
  }, [allCollectibles]);
  
  // No longer need auto-selection since we're using initialEpoch directly
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying || !selectedEpoch) return;
    
    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    // Get the max generation for this epoch
    const epochTokens = tokensByEpoch.current[selectedEpoch] || {};
    const generations = Object.keys(epochTokens).map(g => parseInt(g));
    
    if (generations.length === 0) {
      setIsPlaying(false);
      return;
    }
    
    const maxGen = Math.max(...generations);
    
    // Start animation loop
    animationRef.current = setInterval(() => {
      setCurrentGeneration(prev => {
        // Find next valid generation
        let nextGen = prev + 1;
        
        // Loop back to beginning if we exceed max
        if (nextGen > maxGen) {
          nextGen = Math.min(...generations);
        }
        
        // Skip generations that don't have tokens
        while (!epochTokens[nextGen] && nextGen <= maxGen) {
          nextGen++;
        }
        
        // If we went past the end, loop back to beginning
        if (nextGen > maxGen) {
          nextGen = Math.min(...generations);
        }
        
        return nextGen;
      });
    }, speed);
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, selectedEpoch, speed]);
  
  // Handle stepping through generations manually
  const handleStepForward = () => {
    if (!selectedEpoch) return;
    
    const epochTokens = tokensByEpoch.current[selectedEpoch] || {};
    const generations = Object.keys(epochTokens).map(g => parseInt(g));
    
    if (generations.length === 0) return;
    
    const maxGen = Math.max(...generations);
    
    setCurrentGeneration(prev => {
      // Find next valid generation
      let nextGen = prev + 1;
      
      // Loop back to beginning if we exceed max
      if (nextGen > maxGen) {
        nextGen = Math.min(...generations);
      }
      
      // Skip generations that don't have tokens
      while (!epochTokens[nextGen] && nextGen <= maxGen) {
        nextGen++;
      }
      
      // If we went past the end, loop back to beginning
      if (nextGen > maxGen) {
        nextGen = Math.min(...generations);
      }
      
      return nextGen;
    });
  };
  
  const handleStepBackward = () => {
    if (!selectedEpoch) return;
    
    const epochTokens = tokensByEpoch.current[selectedEpoch] || {};
    const generations = Object.keys(epochTokens).map(g => parseInt(g));
    
    if (generations.length === 0) return;
    
    const minGen = Math.min(...generations);
    const maxGen = Math.max(...generations);
    
    setCurrentGeneration(prev => {
      // Find previous valid generation
      let prevGen = prev - 1;
      
      // Loop to end if we go below min
      if (prevGen < minGen) {
        prevGen = maxGen;
      }
      
      // Skip generations that don't have tokens
      while (!epochTokens[prevGen] && prevGen >= minGen) {
        prevGen--;
      }
      
      // If we went past the beginning, loop to end
      if (prevGen < minGen) {
        prevGen = maxGen;
      }
      
      return prevGen;
    });
  };
  
  // Get current token to display
  const currentToken = React.useMemo(() => {
    if (!selectedEpoch || currentGeneration <= 0) return null;
    
    const epochTokens = tokensByEpoch.current[selectedEpoch] || {};
    const generationTokens = epochTokens[currentGeneration] || [];
    
    if (generationTokens.length === 0) return null;
    
    // Just pick the first token for this generation
    return generationTokens[0];
  }, [selectedEpoch, currentGeneration]);
  
  // Get the first generation token for the selected epoch
  const getFirstGenerationToken = () => {
    if (!selectedEpoch) return null;
    
    const epochTokens = tokensByEpoch.current[selectedEpoch] || {};
    const generations = Object.keys(epochTokens).map(g => parseInt(g)).sort((a, b) => a - b);
    
    if (generations.length === 0) return null;
    
    // Get the first generation
    const firstGen = generations[0];
    const firstGenTokens = epochTokens[firstGen] || [];
    
    if (firstGenTokens.length === 0) return null;
    
    // Return the first token for this generation
    return firstGenTokens[0];
  };

  // Format animation details
  const formatDetails = () => {
    if (!currentToken || !currentToken.attributes) return "No token selected";
    
    // Add basic token info
    let tokenInfo = `Token #${currentToken.id || '?'}`;
    
    // Format attributes for better mobile display
    const attrLines = currentToken.attributes.map(attr => 
      `${attr.trait_type}: ${attr.value}`
    );
    
    // Join with line breaks for better mobile viewing
    return (
      <div>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px',
          background: '#000080',
          color: '#fff',
          padding: '2px 4px',
          border: '2px solid',
          borderColor: '#000080',
          fontFamily: '"MS Sans Serif", "Tahoma", "Arial", sans-serif'
        }}>{tokenInfo}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
          {attrLines.map((line, index) => (
            <span key={index} style={{ 
              background: '#ffffff',
              padding: '4px 8px', 
              border: '1px solid',
              borderColor: '#404040 #ffffff #ffffff #404040',
              fontSize: '12px',
              boxShadow: 'inset 1px 1px 2px rgba(0, 0, 0, 0.2)'
            }}>
              {line}
            </span>
          ))}
        </div>
      </div>
    );
  };
  
  // Get valid generations for the current epoch
  const validGenerations = React.useMemo(() => {
    if (!selectedEpoch) return [];
    
    const epochTokens = tokensByEpoch.current[selectedEpoch] || {};
    return Object.keys(epochTokens).map(g => parseInt(g)).sort((a, b) => a - b);
  }, [selectedEpoch]);
  
  // Calculate simple min/max slider marks
  const sliderMarks = React.useMemo(() => {
    if (validGenerations.length === 0) return {};
    
    const minGen = Math.min(...validGenerations);
    const maxGen = Math.max(...validGenerations);
    
    return {
      [minGen]: '',
      [maxGen]: ''
    };
  }, [validGenerations]);
  
  // Handle generation input change
  const handleGenerationInputChange = (value) => {
    if (value === '' || isNaN(value)) return;
    
    const numValue = parseInt(value);
    const minGen = Math.min(...validGenerations);
    const maxGen = Math.max(...validGenerations);
    
    // Ensure value is within valid range
    if (numValue >= minGen && numValue <= maxGen) {
      // Find closest valid generation
      let closestGen = validGenerations.reduce((prev, curr) => 
        Math.abs(curr - numValue) < Math.abs(prev - numValue) ? curr : prev
      );
      
      setCurrentGeneration(closestGen);
    }
  };
  
  return (
    <Modal
      title={
        <div style={{ 
          fontSize: "14px", 
          fontWeight: "bold", 
          fontFamily: '"MS Sans Serif", "Tahoma", "Arial", sans-serif',
          textAlign: "center",
          color: "#fff"
        }}>
          g4m3 0f l1f3 Animation - Epoch {selectedEpoch || '?'}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20, maxWidth: '95vw' }}
      bodyStyle={{ 
        padding: "24px", 
        maxHeight: "80vh", 
        overflow: "auto",
        backgroundColor: "#c0c0c0",
        border: "2px solid",
        borderColor: "#ffffff #404040 #404040 #ffffff"
      }}
      centered
      className="win311-window"
    >
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={6}>
                <Text strong>Animation Speed:</Text>
              </Col>
              <Col xs={24} sm={18}>
                <Slider
                  className="win311-slider"
                  min={100}
                  max={2000}
                  step={100}
                  value={speed}
                  onChange={value => setSpeed(value)}
                  marks={{
                    100: "Fast",
                    1000: "Normal",
                    2000: "Slow"
                  }}
                  reverse
                  tooltip={{
                    formatter: value => `${value}ms`
                  }}
                />
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={6}>
                <Text strong>Generation:</Text>
              </Col>
              <Col xs={16} sm={14}>
                <Slider
                  className="win311-slider"
                  value={currentGeneration}
                  onChange={value => setCurrentGeneration(value)}
                  min={Math.min(...(validGenerations.length > 0 ? validGenerations : [0]))}
                  max={Math.max(...(validGenerations.length > 0 ? validGenerations : [0]))}
                  marks={sliderMarks}
                  disabled={validGenerations.length === 0}
                  tooltip={{ formatter: null }} // Hide tooltip
                />
              </Col>
              <Col xs={8} sm={4}>
                <Input
                  className="win311-input"
                  value={currentGeneration}
                  onChange={e => handleGenerationInputChange(e.target.value)}
                  disabled={validGenerations.length === 0}
                  style={{ width: '100%' }}
                  placeholder="Gen #"
                  type="number"
                  min={Math.min(...(validGenerations.length > 0 ? validGenerations : [0]))}
                  max={Math.max(...(validGenerations.length > 0 ? validGenerations : [0]))}
                />
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} sm="auto">
                <Space size="middle" wrap style={{ width: '100%', justifyContent: 'center' }}>
                  <Button 
                    className="win311-button"
                    onClick={handleStepBackward}
                    disabled={!selectedEpoch || validGenerations.length === 0}
                    icon={<StepBackwardOutlined style={{ fontSize: '18px' }} />}
                    style={{ height: '48px', width: '48px' }}
                  />
                  <Button
                    className="win311-button win311-button-primary win311-button-large"
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={!selectedEpoch || validGenerations.length === 0}
                    icon={isPlaying ? <PauseCircleOutlined style={{ fontSize: '20px' }} /> : <PlayCircleOutlined style={{ fontSize: '20px' }} />}
                    style={{ minWidth: '120px' }}
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button 
                    className="win311-button"
                    onClick={handleStepForward}
                    disabled={!selectedEpoch || validGenerations.length === 0}
                    icon={<StepForwardOutlined style={{ fontSize: '18px' }} />}
                    style={{ height: '48px', width: '48px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px', fontSize: '14px' }}>Details:</span>
                    <Switch 
                      className="win311-switch"
                      checked={showDetails} 
                      onChange={setShowDetails} 
                      checkedChildren="On" 
                      unCheckedChildren="Off" 
                    />
                  </div>
                </Space>
              </Col>
            </Row>
          </Space>
        </Col>
        
        <Col span={24}>
          <div 
            className="animation-container"
            style={{ 
              position: "relative",
              width: "100%", 
              height: "calc(40vh - 60px)", 
              minHeight: "250px",
              backgroundColor: "#111",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              border: "1px solid #333",
              borderRadius: "8px",
              marginBottom: showDetails ? "120px" : "0"
            }}
          >
            {currentToken ? (
              <>
                <img 
                  src={currentToken.image}
                  alt={`Epoch ${selectedEpoch} Generation ${currentGeneration}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain"
                  }}
                />
                
                {/* Image only in the container */}
                
              </>
            ) : (
              selectedEpoch ? (
                <>
                  {/* Display first generation of epoch as placeholder */}
                  {(() => {
                    const firstGenToken = getFirstGenerationToken();
                    if (firstGenToken) {
                      return (
                        <div 
                          style={{ position: "relative", cursor: "pointer" }}
                          onClick={() => setIsPlaying(true)}
                        >
                          <img 
                            src={firstGenToken.image}
                            alt={`Epoch ${selectedEpoch} First Generation`}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              opacity: 0.5
                            }}
                          />
                          <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            textAlign: "center",
                            color: "#fff",
                            backgroundColor: "rgba(0,0,0,0.7)",
                            padding: "15px 30px",
                            borderRadius: "8px",
                            zIndex: 2,
                            transition: "all 0.2s ease",
                            width: "80%",
                            maxWidth: "300px"
                          }}
                          className="play-overlay"
                          >
                            <PlayCircleOutlined style={{ fontSize: "40px", marginBottom: "10px" }} />
                            <div style={{ fontFamily: "monospace" }}>Click to play animation</div>
                          </div>
                        </div>
                      );
                    } else {
                      return <Text style={{ color: "#666" }}>No tokens found for this epoch</Text>;
                    }
                  })()}
                </>
              ) : (
                <Text style={{ color: "#666" }}>Select an epoch to begin</Text>
              )
            )}
          </div>
          
          {/* Details panel below the image */}
          {showDetails && currentToken && (
            <div 
              className="details-panel"
              style={{
                position: "absolute",
                bottom: "20px",
                left: "24px",
                right: "24px",
                padding: "15px",
                backgroundColor: "#c0c0c0",
                color: "#000",
                border: "2px solid",
                borderColor: "#ffffff #404040 #404040 #ffffff",
                boxShadow: "2px 2px 0 #222222",
                borderRadius: "0",
                fontFamily: "monospace",
                fontSize: "14px",
                textAlign: "center",
                maxHeight: "120px",
                overflowY: "auto",
                zIndex: 10
              }}>
              {formatDetails()}
            </div>
          )}
        </Col>
      </Row>
    </Modal>
  );
}

export default AnimationModal;