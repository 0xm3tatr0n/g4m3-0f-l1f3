pragma solidity >=0.7.0 <0.8.0;
// pragma abicoder v2;
import '@openzeppelin/contracts/utils/Strings.sol';
import {Structs} from './Structs.sol';
import 'hardhat/console.sol';

library G0l {
  function returnColor(uint256 paletteNumber, uint256 colorPos)
    public
    pure
    returns (string memory)
  {
    // console.log('palette no, pos: ', paletteNumber, colorPos);
    string[7][22] memory colorPalettes = [
      // background, live, dead, born0, born1, perished0, perished1
      // 0 0/0: bad. rural, shrinking slowly
      // 1 0/1: bad. rural, shrinking slowly
      // 2 1/0: bad. rural, shrinking rapidly
      // 3 1/1: bad. rural, shrinking rapidly
      // 4 2/0: good. urban, shrinking slowly
      // 5 2/1: good. urban, shrinking slowly
      // 6 3/0: good. urban, shrinking rapidly
      // 7 3/1: good. urban, shrinking rapidly
      // 8 4/0: good. rural, growing slowly
      // 9 4/1: good. rural, growing slowly
      // 10 5/0: good. rural, growing rapidly
      // 11 5/1: good. rural, growing rapidly
      // 12 6/0: bad: urban, growing slowly
      // 13 6/1: bad: urban, growing slowly
      // 14 7/0: bad: urban, growing rapidly
      // 15 7/1: bad: urban, growing rapidly
      // 16 8/0: urban. zero net change.
      // 17 8/1: urban. zero net change.
      // 18 9/0: rural. zero net change.
      // 19 9/1: rural. zero net change.

      // 0: bad. rural, shrinking slowly
      ['#EDEBD7', '#E3B23C', '#423E37', '#17BEBB', '#74A57F', '#FE6D73', '#7D5BA6'],
      // 1: bad. rural, shrinking rapidly
      ['#071E22', '#FF1053', '#251101', '#5BC0EB', '#D2F898', '#495159', '#3D3522'],
      // 2: good. urban, shrinking slowly
      ['#1C7C54', '#A80874', '#E3D8F1', '#86BBD8', '#33658A', '#FF7F11', '#F0F66E'],
      // 3: good. urban, shrinking rapidly
      ['#E6FDFF', '#87FF65', '#C04CFD', '#5E2BFF', '#D2F898', '#ED254E', '#EADEDA'],
      // 4: good. rural, growing slowly
      ['#34287E', '#1E62AB', '#423E37', '#92B83C', '#469D45', '#FAED24', '#C7381D'],
      // 5: good. rural, growing rapidly
      ['#ff206e', '#fbff12', '#41ead4', '#fbff12', '#fbff12', '#fbff12', '#fbff12'],
      // 6: bad: urban, growing slowly
      ['#201335', '#f78154', '#201335', '#5fad56', '#4d9078', '#f78154', '#b4436c'],
      // 7: bad: urban, growing rapidly
      ['#212529', '#f8f9fa', '#343a40', '#dee2e6', '#dee2e6', '#495057', '#495057'],
      // 8: urban. zero net change.
      ['#061A40', '#003559', '#B9D6F2', '#006DAA', '#B9D6F2', '#003559', '#BFD7EA'],
      // 9: rural. zero net change.
      ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'],
      // 10
      ['#FFFFFF', '#C2E812', '#BFCBC2', '#91F5AD', '#91F5AD', '#FF934F', '#FF934F'],
      // 11
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC'],
      // 12
      ['#061A40', '#003559', '#B9D6F2', '#006DAA', '#B9D6F2', '#003559', '#BFD7EA'],
      // 13
      ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'],
      // 14
      ['#FFFFFF', '#C2E812', '#BFCBC2', '#91F5AD', '#91F5AD', '#FF934F', '#FF934F'],
      // 15
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC'],
      // 16
      ['#FFFFFF', '#C2E812', '#BFCBC2', '#91F5AD', '#91F5AD', '#FF934F', '#FF934F'],
      // 17
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC'],
      // 18
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC'],
      // 19
      ['#FFFFFF', '#C2E812', '#BFCBC2', '#91F5AD', '#91F5AD', '#FF934F', '#FF934F'],
      // 20
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC'],
      // 21
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC']
    ];

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

  function generateRepresentationName(uint256 representation) public pure returns (string memory) {
    if (representation == 0) {
      return 'raw';
    } else if (representation == 1) {
      return 'static';
    } else if (representation == 2) {
      return 'arrows';
    } else if (representation == 3) {
      return 'blocks';
    } else if (representation == 4) {
      return 'pixel';
    } else if (representation == 5) {
      return 'circle';
    }
  }

  function generateTimesNumber(
    // individual variables to make function public
    uint256 popUp,
    uint256 popDiff,
    uint256 seed,
    uint256 density
  ) public pure returns (uint256) {
    // (replicating current state to get started somewhere. better would be better.)
    // should commit to final number of pallettes: 24?
    // trying to figure out dramaturgy of times
    bool densityThreshold = density >= 25;

    // determin if population difference is above threshold
    bool diffThreshold = popDiff > 3;

    // initialize times variable
    uint256 times = 0;
    // change times depending on population evolution vs. previous round
    if (popUp == 0 && densityThreshold) {
      // population low & shrinking
      // rural
      // bad times
      times = diffThreshold ? 1 : 0; // rapid change : slow change
    } else if (popUp == 0 && densityThreshold) {
      // population high & shrinking
      // urban
      // good times
      times = diffThreshold ? 3 : 2; // rapid change : slow change
    } else if (popUp == 1 && densityThreshold) {
      // population low & growing
      // rural
      // good time
      times = diffThreshold ? 5 : 4; // rapid change : slow change
    } else if (popUp == 1 && densityThreshold) {
      // population high & growing
      // urban
      // bad time
      times = diffThreshold ? 7 : 6; // rapid change : slow change
    } else if (popUp == 99) {
      // population remained constant
      // low probability
      if (densityThreshold) {
        //
        times = 8;
      } else {
        //
        times = 9;
      }
    }

    // shift "randomly"

    times = (times * 2) + ((seed % 2));

    return times;
  }

  function generateTimesName(uint256 times) public pure returns (string memory) {
    string memory timesName;
    if (times == 0) {
      timesName = 'stable';
    } else if (times == 1) {
      timesName = 'good';
    } else if (times == 2) {
      timesName = 'bad';
    } else if (times == 3) {
      timesName = 'zero';
    }

    return timesName;
  }

  function generateAttributeString(Structs.MetaData memory metadata)
    internal
    pure
    returns (string memory)
  {
    string memory timesName = generateTimesName(metadata.times);
    string memory representationName = generateRepresentationName(metadata.representation);

    string memory attributeString = string(
      abi.encodePacked(
        ' "attributes": [{"trait_type": "generation", "value": "#',
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

    if (representation < 5) {
      // rectangle case
      i_scale = Strings.toString(i * unitScale + 2 + 20);
      j_scale = Strings.toString(j * unitScale + 2 + 20);
    } else {
      // circle case
      i_scale = Strings.toString(i * unitScale + 20 + 20);
      j_scale = Strings.toString(j * unitScale + 20 + 20);
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
            '<polygon points="0,36 18,36 18,0 36,0 36,18 0,18" fill="',
            colorMap.bornColor,
            '">',
            G0l.returnBornAnimation(colorMap, i, j, representation),
            '</polygon>',
            '</g>'
          )
        );
      } else if (representation == 5) {
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
            '<polygon points="0,36 18,36 18,0 36,0 36,18 0,18" fill="',
            colorMap.perishedColor,
            '">',
            G0l.returnPerishedAnimation(colorMap, i, j, representation),
            '</polygon>',
            '</g>'
          )
        );
      } else if (representation == 5) {
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
