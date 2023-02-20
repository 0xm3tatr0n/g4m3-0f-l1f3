pragma solidity >=0.7.0 <0.8.0;

//SPDX-License-Identifier: MIT

library Structs {
  struct MetaData {
    uint8 birthCount;
    uint8 deathCount;
    uint8 populationDensity;
    uint8 popDiff;
    string name;
    string description;
    string generation;
    string trend;
    uint8 times; // 0: stable, 1: prosperous, 2: bad
    // uint8 representation; // to be replaced by shape/speed/pattern
    uint8 shape;
    uint8 speed;
    uint8 pattern;
    uint256 seed;
  }

  struct Trends {
    uint8 popDiff;
    uint8 up;
    uint8 births;
    uint8 deaths;
  }

  struct ColorMap {
    string backgroundColor;
    string aliveColor;
    string deadColor;
    string bornColor;
    string perishedColor;
  }

  struct CellData {
    bool alive;
    bool hasChanged;
    uint8 bornCounter;
    uint8 perishedCounter;
    // uint8 representation;
    uint8 shape; // 0: circles, 1: blocks, 2: blocks/triangles
    uint8 speed; // 0: raw, 1: static, 2: slow, 3: medium, 4: fast ,1,2 : lower == slower
    uint8 pattern; // 0: random, 1: matrix, 2: ...
    uint8 i;
    uint8 j;
    uint8 unitScale;
  }
}
