import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Col, Input, List, Menu, Row } from "antd";
import { ItemCard } from ".";

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
  } = props;

  return (
    <div style={{ maxWidth: 1020, margin: "auto", paddingBottom: 256, paddingLeft: "16px", paddingRight: "16px" }}>
      <Row gutter={[16, 16]}>
        {allCollectibles ? (
          allCollectibles.map((c, icx) => {
            return (
              <Col xs={24} md={12} lg={8} key={`collectible-${icx}`}>
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
        ) : (
          <Col span={24} style={{ fontFamily: "monospace" }}>
            no collectibles
          </Col>
        )}
      </Row>
    </div>
  );
}

export default Gallery;
