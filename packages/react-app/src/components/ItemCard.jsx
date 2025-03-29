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
    <div ref={cardRef}>
      {isFront ? (
        <Card
          style={{
            margin: "auto",
            borderRadius: "0",
            border: "2px solid #c3c3c3",
            overflow: "hidden",
            backgroundColor: "white",
            padding: "0px",
            minHeight: "100px", // Ensure card has size even before image loads
          }}
          bodyStyle={{ padding: "0" }}
          onClick={flipCard}
        >
          {!isVisible ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
              {/* Placeholder for not yet visible */}
            </div>
          ) : !imageLoaded ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
              <Spin tip="Loading..." />
            </div>
          ) : null}

          {isVisible && (
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: "100%",
                height: "100%",
                display: imageLoaded ? "block" : "none",
              }}
              onLoad={handleImageLoad}
            />
          )}
        </Card>
      ) : (
        <Card
          style={{ margin: "auto", borderRadius: "0", border: "2px solid #c3c3c3", overflow: "hidden" }}
          onClick={flipCard}
        >
          <div style={{ width: "100%", margin: "auto" }}>
            <div style={{ fontWeight: "bold" }}>{item.name}</div>
            <div style={{ fontSize: "0.8em" }}>owned by: {item.owner}</div>
            <div style={{ marginTop: "10px" }}>traits:</div>
            {item.attributes &&
              item.attributes.map((a, iax) => {
                return (
                  <div key={`attribute-${iax}`} style={{ fontSize: "0.9em" }}>
                    {a.trait_type}: {a.value}
                  </div>
                );
              })}
            {/* <div style={{ marginTop: "15px" }}>
              <AddressInput
                ensProvider={ensProvider}
                placeholder="transfer to address"
                value={transferToAddresses[item.id]}
                onChange={newValue => {
                  const update = {};
                  update[item.id] = newValue;
                  setTransferToAddresses({ ...transferToAddresses, ...update });
                }}
                onClick={e => {
                  e.stopPropagation();
                }}
              />
              <Button
                style={{ marginTop: "10px" }}
                onClick={e => {
                  e.stopPropagation();
                  tx(writeContracts.G4m3.transferFrom(address, transferToAddresses[item.id], item.id));
                }}
              >
                Transfer
              </Button>
            </div> */}
          </div>
        </Card>
      )}
    </div>
  );
}

export default ItemCard;
