pragma solidity >=0.7.0 <0.8.0;

//SPDX-License-Identifier: MIT

library Structs {
  struct MetaData {
    uint8 birthCount; // can't be more than 64, so should be uint8
    uint8 deathCount; // can't be more than 64, so should be uint8
    uint8 populationDensity; // can't be more than 64, so should be uint8
    uint8 popDiff; // can't be more than 64, so should be uint8
    string name;
    string description;
    string generation;
    string trend;
    uint8 times; // 0: stable, 1: prosperous, 2: bad
    uint8 representation; // to be replaced by shape/speed/pattern
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
    uint8 representation;
    uint8 shape;
    uint8 speed;
    uint8 pattern;
    uint8 i;
    uint8 j;
    uint8 unitScale;
  }
}
