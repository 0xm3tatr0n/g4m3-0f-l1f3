import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Col, Input, List, Menu, Row, InputNumber, Slider, Pagination } from "antd";
import { ItemCard } from ".";

const defaultStats = { totalSupply: 0, latestGen: "n/a" };

// Stats component
function Stats(props) {
  const { collectibles } = props;

  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    // for now: single function to consolidate stats
    const generateStats = async () => {
      //
      console.log(">>> generating fresh stats");
      const latestGen = collectibles.reduce((accumulator, currentValue) => {
        // console.log('>>> reducing: ', accumulator );
        const attributes = currentValue.attributes;
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
      console.log(">>> new stats: ", newStats);
      setStats(newStats);
    };

    if (collectibles && collectibles.length > 0) {
      // only generate stats if there are collectibles
      console.log(">>> should generate new stats:");
      generateStats();
    }
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
  const { zoomLevel, setZoomLevel, totalSupply, setGalleryLoadRange } = props;

  const [paginationCurrent, setPaginationCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // handle data loading when params change
    const loadTokens = async () => {
      // change galleryLoadRange
      // new range
      const rangeMin = (paginationCurrent - 1) * pageSize + 1;
      const rangeMax = paginationCurrent * pageSize;
      console.log(`>>>> changing range. current: ${paginationCurrent}. size: ${pageSize}`);
      console.log(`>>>> range min: ${rangeMin}, range max: ${rangeMax}`);
      setGalleryLoadRange([rangeMin, rangeMax]);
    };

    loadTokens();
  }, [paginationCurrent, pageSize]);

  const onChangeZoom = newValue => {
    setZoomLevel(newValue);
  };

  const onChangePage = page => {
    // do something
    console.log(`setting pagination index to ${page}`);
    setPaginationCurrent(page);
  };

  const onShowSizeChange = (current, newPageSize) => {
    console.log(`page size changed current: ${current}, pageSize: ${newPageSize}`);
    setPageSize(newPageSize);
  };

  return (
    <>
      <Col span={4}>
        <Slider min={1} max={5} onChange={onChangeZoom} value={typeof zoomLevel === "number" ? zoomLevel : 0} />
      </Col>
      <Col span={12}>
        <Pagination
          defaultCurrent={paginationCurrent}
          defaultPageSize={50}
          total={totalSupply}
          onChange={onChangePage}
          onShowSizeChange={onShowSizeChange}
        />
      </Col>
    </>
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
  } = props;

  const [zoomLevel, setZoomLevel] = useState(3);

  const parseZoom = zoomLevel => {
    if (zoomLevel < 4) {
      return 2 ** zoomLevel;
    }
    if (zoomLevel === 4) {
      return 12;
    }
    if (zoomLevel === 5) {
      return 24;
    }
  };

  return (
    <div style={{ maxWidth: 1020, margin: "auto", paddingBottom: 256, paddingLeft: "16px", paddingRight: "16px" }}>
      <Row>
        <GalleryControl
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          totalSupply={totalSupply}
          setGalleryLoadRange={setGalleryLoadRange}
        />
      </Row>
      <Row>
        <Stats collectibles={allCollectibles} />
      </Row>
      <Row gutter={[16, 16]}>
        {allCollectibles ? (
          allCollectibles.map((c, icx) => {
            return (
              <Col
                xs={parseZoom(zoomLevel)}
                md={parseZoom(zoomLevel)}
                lg={parseZoom(zoomLevel)}
                key={`collectible-${icx}`}
              >
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
