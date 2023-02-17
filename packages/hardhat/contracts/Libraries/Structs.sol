pragma solidity >=0.7.0 <0.8.0;

//SPDX-License-Identifier: MIT

library Structs {
  struct MetaData {
    uint256 birthCount; // can't be more than 64, so should be uint8
    uint256 deathCount; // can't be more than 64, so should be uint8
    uint256 populationDensity; // can't be more than 64, so should be uint8
    uint256 popDiff; // can't be more than 64, so should be uint8
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
    uint256 popDiff;
    uint256 up;
    uint256 births;
    uint256 deaths;
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
    uint256 i;
    uint256 j;
    uint8 bornCounter;
    uint8 perishedCounter;
    uint256 representation;
    uint256 unitScale;
  }
}
