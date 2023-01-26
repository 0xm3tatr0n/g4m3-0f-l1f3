pragma solidity >=0.7.0 <0.8.0;
// pragma abicoder v2;
import '@openzeppelin/contracts/utils/Strings.sol';
import {Structs} from './Structs.sol';

library G0l {
  function returnColor(uint256 paletteNumber, uint256 colorPos)
    external
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
    if (representation >= 2) {
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

  function returnBornAnimation(
    Structs.ColorMap memory colorMap,
    uint256 i,
    uint256 j,
    uint256 representation
  ) internal pure returns (string memory) {
    //
    if (representation >= 2) {
      return
        string(
          abi.encodePacked(
            '<animate attributeType="XML" attributeName="fill" values="',
            colorMap.aliveColor,
            ';',
            colorMap.bornColor,
            ';',
            colorMap.aliveColor,
            ';',
            colorMap.aliveColor,
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
    } else if (metadata.representation == 3) {
      representationName = 'circle';
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

  function renderGameSquare(
    bool alive,
    bool hasChanged,
    uint256 i,
    uint256 j,
    Structs.ColorMap memory colorMap,
    uint256 representation,
    uint256 unitScale
  ) internal pure returns (string memory) {
    //
    string memory square;
    string memory i_scale;
    string memory j_scale;

    if (representation < 4) {
      // rectangle case
      i_scale = Strings.toString(i * unitScale + 2);
      j_scale = Strings.toString(j * unitScale + 2);
    } else {
      // circle case
      i_scale = Strings.toString(i * unitScale + 20);
      j_scale = Strings.toString(j * unitScale + 20);
    }

    if (alive && !hasChanged) {
      // was alive last round
      square = string(
        abi.encodePacked('<use href="#l0" ', 'x="', i_scale, '" y="', j_scale, '" />')
      );
    } else if (alive && hasChanged) {
      // case: new born
      if (representation == 0) {
        // raw
        square = string(
          abi.encodePacked('<use href="#l0" ', 'x="', i_scale, '" y="', j_scale, '" />')
        );
      } else if (representation == 1) {
        square = string(
          abi.encodePacked('<use href="#b0" ', 'x="', i_scale, '" y="', j_scale, '" />')
        );
      } else if (representation == 2) {
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<use href="#l0" />',
            '<polygon points="36,0 36,36 0,0" fill="',
            colorMap.bornColor,
            '">',
            G0l.returnBornAnimation(colorMap, i, j, representation),
            '</polygon>',
            '</g>'
          )
        );
      } else if (representation == 3) {
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<use href="#l0" />',
            '<polygon points="0,0 0,36 36,36 36,0" fill="',
            colorMap.bornColor,
            '">',
            G0l.returnBornAnimation(colorMap, i, j, representation),
            '</polygon>',
            '</g>'
          )
        );
      } else if (representation == 4) {
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<use href="#l0" />',
            '<circle r="18" fill="',
            colorMap.bornColor,
            '">',
            G0l.returnBornAnimation(colorMap, i, j, representation),
            '</circle>',
            '</g>'
          )
        );
      }
    } else if (!alive && !hasChanged) {
      // case: didn't exist in previous round
      square = string(
        abi.encodePacked('<use href="#d0" ', 'x="', i_scale, '" y="', j_scale, '" />')
      );
    } else if (!alive && hasChanged) {
      // case: died this round
      if (representation == 0) {
        square = string(
          abi.encodePacked('<use href="#d0" ', 'x="', i_scale, '" y="', j_scale, '" />')
        );
      } else if (representation == 1) {
        square = string(
          abi.encodePacked('<use href="#p0" transform="translate(', i_scale, ',', j_scale, ')" />')
        );
      } else if (representation == 2) {
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<use href="#d0" />',
            '<polygon points="0,36 36,36 0,0" fill="',
            colorMap.perishedColor,
            '">',
            G0l.returnPerishedAnimation(colorMap, i, j, representation),
            '</polygon>',
            '</g>'
          )
        );
      } else if (representation == 3) {
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<use href="#d0" />',
            '<polygon points="0,0 0,36 36,36 36,0" fill="',
            colorMap.perishedColor,
            '">',
            G0l.returnPerishedAnimation(colorMap, i, j, representation),
            '</polygon>',
            '</g>'
          )
        );
      } else if (representation == 4) {
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<use href="#d0" />',
            '<circle r="18" fill="',
            colorMap.perishedColor,
            '">',
            G0l.returnPerishedAnimation(colorMap, i, j, representation),
            '</circle>',
            '</g>'
          )
        );
      }
    }

    return square;
  }
}
