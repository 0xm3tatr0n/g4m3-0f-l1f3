import React, { useEffect, useState, useRef } from "react";
import { Button, Card, Spin } from "antd";
import { AddressInput } from ".";

function ItemCard(props) {
  const { item, ensProvider, transferToAddresses, setTransferToAddresses, writeContracts, address, tx } = props;
  const [isFront, setIsFront] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef();

  // Function to flip card
  const flipCard = () => {
    setIsFront(!isFront);
  };

  // Image load handler
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

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
      {isFront ? (
        <Card
          style={{
            margin: "auto",
            borderRadius: "0",
            border: "2px solid #c3c3c3",
            overflow: "hidden",
            backgroundColor: "white",
            padding: "0px",
            height: "100%", // Fill the parent container height
            width: "100%", // Fill the parent container width
            position: "absolute", // Position absolutely to ensure it fills the parent
            top: 0,
            left: 0
          }}
          bodyStyle={{ padding: "0", height: "100%" }}
          onClick={flipCard}
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
              overflow: "hidden", // Prevent any potential overflow
            }}>
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover", // Cover the container
                  display: imageLoaded ? "block" : "none",
                }}
                onLoad={handleImageLoad}
              />
            </div>
          )}
        </Card>
      ) : (
        <Card
          style={{ 
            margin: "auto", 
            borderRadius: "0", 
            border: "2px solid #c3c3c3", 
            overflow: "hidden",
            height: "100%", // Fill the parent container height
            width: "100%", // Fill the parent container width
            position: "absolute", // Position absolutely to ensure it fills the parent
            top: 0,
            left: 0,
            backgroundColor: "white"
          }}
          bodyStyle={{ 
            padding: "10px", 
            height: "100%",
            overflow: "auto" // Add scrolling if content is too large
          }}
          onClick={flipCard}
        >
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: "bold", fontSize: "0.9em" }}>{item.name}</div>
            <div style={{ fontSize: "0.7em" }}>owned by: {item.owner}</div>
            <div style={{ marginTop: "8px", fontSize: "0.8em" }}>traits:</div>
            <div style={{ overflow: "auto", flex: 1 }}>
              {item.attributes &&
                item.attributes.map((a, iax) => {
                  return (
                    <div key={`attribute-${iax}`} style={{ fontSize: "0.75em", margin: "2px 0" }}>
                      {a.trait_type}: {a.value}
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ItemCard;
