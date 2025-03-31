import React, { useEffect, useState, useRef } from "react";
import { Button, Card, Spin, Tooltip } from "antd";
import { AddressInput } from ".";

function ItemCard(props) {
  const { item, ensProvider, transferToAddresses, setTransferToAddresses, writeContracts, address, tx, zoomLevel = 5 } = props;
  const [isFront, setIsFront] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef();

  // Set default zoom level to 5 (largest) if not provided
  // This ensures flipping works on the mint page where zoomLevel might not be provided
  
  // Function to flip card
  const flipCard = (e) => {
    // Prevent event bubbling
    if (e) e.stopPropagation();
    setIsFront(!isFront);
  };

  // Image load handler
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Determine if we should use tooltip or flip
  // Use tooltip only for zoom levels 1-2 in the gallery
  const useTooltip = zoomLevel !== undefined && zoomLevel < 3;
  
  // Render metadata content for both tooltip and card back
  const renderMetadata = () => (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      display: "flex", 
      flexDirection: "column",
      padding: useTooltip ? "8px" : "10px", // Add padding for all cases
      maxWidth: useTooltip ? "240px" : "auto", // Limit tooltip width
      maxHeight: useTooltip ? "400px" : "auto", // Limit tooltip height
      backgroundColor: "white", // Ensure background is white
      color: "#333" // Dark text color for readability
    }}>
      <div style={{ 
        fontWeight: "bold", 
        fontSize: useTooltip ? "12px" : "1em", 
        marginBottom: "4px",
        textAlign: "center"
      }}>
        {item.name}
      </div>
      <div style={{ 
        fontSize: useTooltip ? "10px" : "0.75em",
        marginBottom: "8px",
        textAlign: "center",
        opacity: 0.7
      }}>
        owned by: {item.owner}
      </div>
      <div style={{ 
        marginTop: "8px", 
        fontSize: useTooltip ? "11px" : "0.9em",
        fontWeight: "bold",
        borderBottom: "1px solid #eee", 
        paddingBottom: "4px"
      }}>
        Traits:
      </div>
      <div style={{ overflow: "auto", flex: 1, marginTop: "4px" }}>
        {item.attributes &&
          item.attributes.map((a, iax) => {
            return (
              <div key={`attribute-${iax}`} style={{ 
                fontSize: useTooltip ? "10px" : "0.8em", 
                margin: "4px 0",
                display: "flex",
                justifyContent: "space-between" 
              }}>
                <span style={{ fontWeight: "500" }}>{a.trait_type}:</span> 
                <span>{a.value}</span>
              </div>
            );
          })}
      </div>
    </div>
  );

  // Setup intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }, // Trigger when 10% of the element is visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={cardRef} 
      style={{
        aspectRatio: "1/1", // Force 1:1 aspect ratio
        width: "100%",
        position: "relative"
      }}
    >
      {/* For small sizes, use Tooltip instead of flipping */}
      {useTooltip ? (
        // Small zoom levels - use tooltip
        <Tooltip 
          title={renderMetadata()} 
          color="#fff" 
          overlayInnerStyle={{ color: "#000" }}
          mouseEnterDelay={0.5} // Delay before showing tooltip
          placement="right"
        >
          <Card
            style={{
              margin: "auto",
              borderRadius: "0",
              border: "2px solid #c3c3c3",
              overflow: "hidden",
              backgroundColor: "white",
              padding: "0px",
              height: "100%",
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              cursor: "pointer" // Show pointer cursor for tooltip
            }}
            bodyStyle={{ padding: "0", height: "100%" }}
          >
            {!isVisible ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                {/* Placeholder for not yet visible */}
              </div>
            ) : !imageLoaded ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Spin size="small" />
              </div>
            ) : null}

            {isVisible && (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: imageLoaded ? "block" : "none",
                  }}
                  onLoad={handleImageLoad}
                />
              </div>
            )}
          </Card>
        </Tooltip>
      ) : (
        // Larger sizes - use card flipping with CSS classes
        <div className={`card-container ${!isFront ? 'card-flipped' : ''}`} onClick={flipCard}>
          {/* Front of card */}
          <div className="card-front">
            <Card
              style={{
                margin: "0",
                borderRadius: "0",
                border: "2px solid #c3c3c3",
                overflow: "hidden",
                backgroundColor: "white",
                padding: "0px",
                height: "100%",
                width: "100%",
                cursor: "pointer" // Show pointer cursor for flipping
              }}
              bodyStyle={{ padding: "0", height: "100%" }}
            >
              {!isVisible ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  {/* Placeholder for not yet visible */}
                </div>
              ) : !imageLoaded ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Spin tip="Loading..." />
                </div>
              ) : null}

              {isVisible && (
                <div style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: imageLoaded ? "block" : "none",
                    }}
                    onLoad={handleImageLoad}
                  />
                </div>
              )}
            </Card>
          </div>
          
          {/* Back of card */}
          <div className="card-back">
            <Card
              style={{ 
                margin: "0", 
                borderRadius: "0", 
                border: "2px solid #c3c3c3", 
                overflow: "auto",
                height: "100%",
                width: "100%",
                backgroundColor: "white",
                cursor: "pointer" // Show pointer cursor for flipping
              }}
              bodyStyle={{ 
                padding: "10px", 
                height: "100%",
                overflow: "auto",
                background: "white"
              }}
            >
              {renderMetadata()}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemCard;
