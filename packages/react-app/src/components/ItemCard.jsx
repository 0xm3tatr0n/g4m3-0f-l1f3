import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Col, Input, List, Menu, Row } from "antd";
import { Account, Address, AddressInput, Contract, Faucet, GasGauge, Header, Ramp, ThemeSwitch } from ".";

function ItemCard(props) {
  const { item, ensProvider, blockExplorer, transferToAddresses, setTransferToAddresses, writeContracts, address, tx } =
    props;
  const [isFront, setIsFront] = useState(true);
  const flipCard = () => {
    setIsFront(!isFront);
  };

  return (
    <div>
      {isFront ? (
        <Card
          style={{
            margin: "auto",
            borderRadius: "0",
            border: "2px solid #c3c3c3",
            overflow: "hidden",
            backgroundColor: "white",
            padding: "0px",
          }}
          bodyStyle={{ padding: "0" }}
          onClick={flipCard}
        >
          <img src={item.image} alt="g0l" style={{ width: "100%", height: "100%" }} />
        </Card>
      ) : (
        <Card
          style={{ margin: "auto", borderRadius: "0", border: "2px solid #c3c3c3", overflow: "hidden" }}
          onClick={flipCard}
        >
          <div style={{ width: "320px", height: "320px", margin: "auto" }}>
            <div>{item.name}</div>
            <div>owned by: {item.owner}</div>
            <div>traits:</div>
            {item.attributes.map((a, iax) => {
              return (
                <div key={`attribute-${iax}`}>
                  {a.trait_type} {a.value}
                </div>
              );
            })}
            <AddressInput
              ensProvider={ensProvider}
              placeholder="transfer to address"
              value={transferToAddresses[item.id]}
              onChange={newValue => {
                // e.stopPropagation();
                const update = {};
                update[item.id] = newValue;
                setTransferToAddresses({ ...transferToAddresses, ...update });
              }}
              onClick={e => {
                e.stopPropagation();
              }}
            />
            <Button
              onClick={e => {
                e.stopPropagation();
                tx(writeContracts.YourCollectible.transferFrom(address, transferToAddresses[item.id], item.id));
              }}
            >
              Transfer
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ItemCard;
