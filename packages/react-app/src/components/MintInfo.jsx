import { PageHeader, Segmented } from "antd";
import React from "react";

function MintInfo(props) {
  const { totalSupply } = props;
  return (
    <div style={{ maxWidth: "800px", margin: "auto", fontFamily: "monospace" }}>
      <div>"The object of art is to give life shape" - Jean Anouilh</div>
      <h2>Teaser:</h2>
      <div>History doesn't repeat, but it rhymes. Every new generation evolves from the previous one.</div>
      <h2>Details:</h2>
      <div>
        g4m3 0f l1f3 is a colorful adaptation of <a href="https://conwaylife.com/">Conway's game of life</a>. Ten
        independent epochs can be minted. Every epoch starts with a random 8x8 arrangement of active / inactive cells
        and iterates according to the rules of the game until 1) the pattern starts repeating or 2) the maximum limit of
        1024 generations per epoch is reached. Given these rules, no more than 10240 tokens can be minted. Final supply
        is likely to be substantially lower, though.
      </div>
      <h2>Minting:</h2>
      <div>
        You can either mint a single token (mintItem) or a pack of five consecutive tokens (mintPack). Other than the
        number of tokens you'll get, the only difference is that minting a pack saves a bit of gas on a per-token basis.
      </div>
      <div>total supply: {totalSupply}</div>
    </div>
  );
}

export default MintInfo;
