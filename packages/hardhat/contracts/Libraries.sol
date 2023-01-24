pragma solidity >=0.7.0 <0.8.0;
//SPDX-License-Identifier: MIT
// externalized elements specifically for G0l
import '@openzeppelin/contracts/utils/Strings.sol';
import {Structs} from './StructsLibrary.sol';

library G0l {
  function returnColor(uint256 paletteNumber, uint256 colorPos)
    internal
    pure
    returns (string memory)
  {
    string[7][12] memory colorPalettes = [
      // background, live, dead, born0, born1, perished0, perished1
      // low density times / rural
      // stable
      ['#EDEBD7', '#E3B23C', '#423E37', '#17BEBB', '#74A57F', '#FE6D73', '#7D5BA6'],
      // good
      ['#071E22', '#FF1053', '#251101', '#5BC0EB', '#D2F898', '#495159', '#3D3522'],
      // bad
      ['#1C7C54', '#A80874', '#E3D8F1', '#86BBD8', '#33658A', '#FF7F11', '#F0F66E'],
      // zero
      ['#E6FDFF', '#87FF65', '#C04CFD', '#5E2BFF', '#D2F898', '#ED254E', '#EADEDA'],
      // new ones, high density times // urban
      // stable
      ['#34287E', '#1E62AB', '#423E37', '#92B83C', '#469D45', '#FAED24', '#C7381D'],
      // good
      ['#ff206e', '#fbff12', '#41ead4', '#fbff12', '#fbff12', '#fbff12', '#fbff12'],
      // bad
      ['#201335', '#f78154', '#201335', '#5fad56', '#4d9078', '#f78154', '#b4436c'],
      // zero
      ['#212529', '#f8f9fa', '#343a40', '#dee2e6', '#dee2e6', '#495057', '#495057'],
      // not in use yet:
      // monochrome
      ['#061A40', '#003559', '#B9D6F2', '#006DAA', '#B9D6F2', '#003559', '#BFD7EA'],
      ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'],
      ['#FFFFFF', '#C2E812', '#BFCBC2', '#91F5AD', '#91F5AD', '#FF934F', '#FF934F'],
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC']
    ];

    // return colorsRainbow[palettePos];
    return colorPalettes[paletteNumber][colorPos];
  }

  function returnPerishedAnimation(
    Structs.ColorMap memory colorMap,
    uint256 i,
    uint256 j,
    uint256 representation
  ) internal pure returns (string memory) {
    //
    if (representation == 2) {
      return
        string(
          abi.encodePacked(
            '<animate attributeType="XML" attributeName="fill" values="',
            colorMap.deadColor,
            ';',
            colorMap.perishedColor,
            ';',
            colorMap.deadColor,
            ';',
            colorMap.deadColor,
            '" dur="1.',
            Strings.toString((i * j) % 9),
            's" repeatCount="indefinite"/>'
          )
        );
    } else {
      return '';
    }
  }

  function getTrends(uint256 bornCells, uint256 perishedCells)
    internal
    pure
    returns (Structs.Trends memory)
  {
    Structs.Trends memory trends;
    trends.births = bornCells;
    trends.deaths = perishedCells;

    if (bornCells > perishedCells) {
      trends.up = 1;
      trends.popDiff = bornCells - perishedCells;
    } else if (bornCells < perishedCells) {
      trends.up = 0;
      trends.popDiff = uint256(-int256(bornCells - perishedCells));
    } else {
      trends.up = 99;
      trends.popDiff = 0;
    }

    return trends;
  }

  function generateAttributeString(Structs.MetaData memory metadata)
    internal
    pure
    returns (string memory)
  {
    string memory timesName;
    if (metadata.times == 0) {
      timesName = 'stable';
    } else if (metadata.times == 1) {
      timesName = 'good';
    } else if (metadata.times == 2) {
      timesName = 'bad';
    } else if (metadata.times == 3) {
      timesName = 'zero';
    }

    string memory representationName;

    if (metadata.representation == 0) {
      representationName = 'raw';
    } else if (metadata.representation == 1) {
      representationName = 'static';
    } else if (metadata.representation == 2) {
      representationName = 'animated';
    }

    string memory attributeString = string(
      abi.encodePacked(
        '", "attributes": [{"trait_type": "generation", "value": "#',
        metadata.generation,
        '"},',
        '{"trait_type" : "density", "value": "',
        Strings.toString(metadata.populationDensity),
        '"},',
        '{"trait_type" : "births", "value": "',
        Strings.toString(metadata.birthCount),
        '"},',
        '{"trait_type" : "deaths", "value": "',
        Strings.toString(metadata.deathCount),
        '"},',
        '{"trait_type" : "trend", "value": "',
        metadata.trend,
        '"},',
        '{"trait_type" : "population_difference", "value": "',
        Strings.toString(metadata.popDiff),
        '"},',
        '{"trait_type" : "times", "value": "',
        timesName,
        '"},',
        '{"trait_type" : "representation", "value": "',
        representationName,
        '"}',
        '],'
      )
    );
    return attributeString;
  }
}

library BitOps {
  function getBooleanFromIndex(uint256 _packedBools, uint256 _boolNumber)
    internal
    pure
    returns (bool)
  {
    // get bool value from integer word at position _boolNumber
    uint256 flag = (_packedBools >> _boolNumber) & uint256(1);
    return (flag == 1 ? true : false);
  }

  function setBooleaOnIndex(
    uint256 _packedBools,
    uint256 _boolNumber,
    bool _value
  ) internal pure returns (uint256) {
    // set bool value on integer word at position _bolNumber
    if (_value) return _packedBools | (uint256(1) << _boolNumber);
    else return _packedBools & ~(uint256(1) << _boolNumber);
  }

  function getCountOfOnBits(uint256 boolsUint) internal pure returns (uint256) {
    // count all the on bits in boolsUint
    uint256 boolsUintCopy = boolsUint;
    uint8 _count = 0;
    for (uint8 i = 0; i < 255; i++) {
      if (boolsUintCopy & 1 == 1) {
        _count++;
      }
      boolsUintCopy >>= 1;
    }
    return _count;
  }
}
