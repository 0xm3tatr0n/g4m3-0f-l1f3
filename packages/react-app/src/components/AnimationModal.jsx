import React, { useEffect, useState, useRef } from "react";
import { Modal, Row, Col, Slider, Select, Button, Space, Spin, Typography, Switch } from "antd";
import { PlayCircleOutlined, PauseCircleOutlined, StepForwardOutlined, StepBackwardOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Text } = Typography;

function AnimationModal(props) {
  const { 
    visible, 
    onClose, 
    allCollectibles, 
    initialEpoch = null 
  } = props;
  
  // State for animation control
  const [selectedEpoch, setSelectedEpoch] = useState(initialEpoch);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [speed, setSpeed] = useState(1000); // milliseconds between frames
  const [showDetails, setShowDetails] = useState(true);
  
  // Refs
  const animationRef = useRef(null);
  const tokensByEpoch = useRef({});
  const maxGeneration = useRef(0);
  
  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedEpoch(initialEpoch);
      setIsPlaying(false);
      setCurrentGeneration(0);
    } else {
      // Stop animation when modal closes
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [visible, initialEpoch]);
  
  // Extract all available epochs from collectibles
  const availableEpochs = React.useMemo(() => {
    if (!allCollectibles || allCollectibles.length === 0) return [];
    
    const epochs = {};
    
    allCollectibles.forEach(item => {
      if (item.attributes) {
        // Find epoch attribute
        const epochAttr = item.attributes.find(attr => attr.trait_type === "epoch");
        if (epochAttr) {
          const epoch = epochAttr.value.replace('#', '');
          epochs[epoch] = true;
        }
      }
    });
    
    return Object.keys(epochs).sort((a, b) => parseInt(a) - parseInt(b));
  }, [allCollectibles]);
  
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
    
    // If we already have a selected epoch but it doesn't exist anymore
    if (selectedEpoch && !epochMap[selectedEpoch]) {
      // Select the first available epoch
      if (availableEpochs.length > 0) {
        setSelectedEpoch(availableEpochs[0]);
      } else {
        setSelectedEpoch(null);
      }
    }
  }, [allCollectibles, availableEpochs, selectedEpoch]);
  
  // Auto-select first epoch if none selected
  useEffect(() => {
    if (!selectedEpoch && availableEpochs.length > 0) {
      setSelectedEpoch(availableEpochs[0]);
    }
  }, [availableEpochs, selectedEpoch]);
  
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
    
    const details = [];
    
    // Add basic token info
    details.push(`Token #${currentToken.id || '?'}`);
    
    // Add attributes
    currentToken.attributes.forEach(attr => {
      details.push(`${attr.trait_type}: ${attr.value}`);
    });
    
    return details.join(" • ");
  };
  
  // Get valid generations for the current epoch
  const validGenerations = React.useMemo(() => {
    if (!selectedEpoch) return [];
    
    const epochTokens = tokensByEpoch.current[selectedEpoch] || {};
    return Object.keys(epochTokens).map(g => parseInt(g)).sort((a, b) => a - b);
  }, [selectedEpoch]);
  
  // Calculate slider marks
  const sliderMarks = React.useMemo(() => {
    if (validGenerations.length === 0) return {};
    
    const marks = {};
    validGenerations.forEach(gen => {
      marks[gen] = gen.toString();
    });
    return marks;
  }, [validGenerations]);
  
  return (
    <Modal
      title={<div style={{ fontSize: "18px", fontWeight: "bold" }}>Game of Life Animation</div>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      bodyStyle={{ padding: "24px", maxHeight: "80vh", overflow: "auto" }}
      centered
    >
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Text strong>Select Epoch:</Text>
              </Col>
              <Col span={18}>
                <Select
                  style={{ width: "100%" }}
                  value={selectedEpoch}
                  onChange={value => {
                    setSelectedEpoch(value);
                    setCurrentGeneration(0);
                    setIsPlaying(false);
                  }}
                  placeholder="Select an epoch"
                >
                  {availableEpochs.map(epoch => (
                    <Option key={epoch} value={epoch}>Epoch {epoch}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
            
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Text strong>Animation Speed:</Text>
              </Col>
              <Col span={18}>
                <Slider
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
            
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Text strong>Generation:</Text>
              </Col>
              <Col span={18}>
                <Slider
                  value={currentGeneration}
                  onChange={value => setCurrentGeneration(value)}
                  min={Math.min(...(validGenerations.length > 0 ? validGenerations : [0]))}
                  max={Math.max(...(validGenerations.length > 0 ? validGenerations : [0]))}
                  marks={sliderMarks}
                  disabled={validGenerations.length === 0}
                />
              </Col>
            </Row>
            
            <Row gutter={16} justify="center">
              <Col>
                <Space>
                  <Button 
                    onClick={handleStepBackward}
                    disabled={!selectedEpoch || validGenerations.length === 0}
                    icon={<StepBackwardOutlined />}
                    size="large"
                  />
                  <Button
                    type="primary"
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={!selectedEpoch || validGenerations.length === 0}
                    icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    size="large"
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button 
                    onClick={handleStepForward}
                    disabled={!selectedEpoch || validGenerations.length === 0}
                    icon={<StepForwardOutlined />}
                    size="large"
                  />
                  <Switch 
                    checked={showDetails} 
                    onChange={setShowDetails} 
                    checkedChildren="Details On" 
                    unCheckedChildren="Details Off" 
                  />
                </Space>
              </Col>
            </Row>
          </Space>
        </Col>
        
        <Col span={24}>
          <div 
            style={{ 
              position: "relative",
              width: "100%", 
              height: "400px", 
              backgroundColor: "#111",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              border: "1px solid #333",
              borderRadius: "8px"
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
                
                {showDetails && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "10px",
                    backgroundColor: "rgba(0,0,0,0.7)",
                    color: "white",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    textAlign: "center"
                  }}>
                    {formatDetails()}
                  </div>
                )}
              </>
            ) : (
              selectedEpoch ? (
                <>
                  {/* Display first generation of epoch as placeholder */}
                  {(() => {
                    const firstGenToken = getFirstGenerationToken();
                    if (firstGenToken) {
                      return (
                        <div style={{ position: "relative" }}>
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
                            zIndex: 2
                          }}>
                            <PlayCircleOutlined style={{ fontSize: "40px", marginBottom: "10px" }} />
                            <div style={{ fontFamily: "monospace" }}>Press Play to begin animation</div>
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
        </Col>
      </Row>
    </Modal>
  );
}

export default AnimationModal;