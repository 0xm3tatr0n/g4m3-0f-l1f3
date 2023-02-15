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
    string[7][20] memory colorPalettes = [
      // background, live, dead, born0, born1, perished0, perished1
      // 0 0/0: bad. rural, shrinking slowly
      ['#ce653b', '#2b0948', '#7d3742', '#461846', '#612844', '#b3563d', '#98463f'],
      // 1 0/1: bad. rural, shrinking slowly
      ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'],
      // 2 1/0: bad. rural, shrinking rapidly
      ['#FFFFFF', '#C2E812', '#BFCBC2', '#91F5AD', '#91F5AD', '#FF934F', '#FF934F'],
      // 3 1/1: bad. rural, shrinking rapidly
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC'],
      // 4 2/0: good. urban, shrinking slowly
      ['#E6FDFF', '#87FF65', '#C04CFD', '#5E2BFF', '#D2F898', '#ED254E', '#EADEDA'],
      // 5 2/1: good. urban, shrinking slowly
      ['#ffee32', '#3d0066', '#fdc500', '#c86bfa', '#5c0099', '#ffd500', '#ffd500'],
      // 6 3/0: good. urban, shrinking rapidly
      ['#ef4043', '#01263d', '#c43240', '#72bad5', '#0e4c6d', '#be1e2d', '#ef4043'],
      // 7 3/1: good. urban, shrinking rapidly
      ['#0fffdb', '#9500ff', '#ff0059', '#2962ff', '#9500ff', '#b4e600', '#ff8c00'],
      // 8 4/0: good. rural, growing slowly
      ['#EDEBD7', '#E3B23C', '#423E37', '#17BEBB', '#74A57F', '#FE6D73', '#7D5BA6'],
      // 9 4/1: good. rural, growing slowly
      ['#1C7C54', '#A80874', '#E3D8F1', '#86BBD8', '#33658A', '#FF7F11', '#F0F66E'],
      // 10 5/0: good. rural, growing rapidly
      ['#34287E', '#1E62AB', '#423E37', '#92B83C', '#469D45', '#FAED24', '#C7381D'],
      // 11 5/1: good. rural, growing rapidly
      ['#201335', '#f78154', '#201335', '#5fad56', '#4d9078', '#f78154', '#b4436c'],
      // 12 6/0: bad: urban, growing slowly
      ['#071E22', '#FF1053', '#251101', '#5BC0EB', '#D2F898', '#495159', '#3D3522'],
      // 13 6/1: bad: urban, growing slowly
      ['#ff206e', '#fbff12', '#41ead4', '#9EF573', '#9EF573', '#FD9040', '#FD9040'],
      // 14 7/0: bad: urban, growing rapidly
      ['#212529', '#f8f9fa', '#343a40', '#dee2e6', '#dee2e6', '#495057', '#495057'],
      // 15 7/1: bad: urban, growing rapidly
      ['#061A40', '#003559', '#B9D6F2', '#006DAA', '#006DAA', '#003559', '#BFD7EA'],
      // 16 8/0: urban. zero net change.
      ['#76520e', '#fad643', '#ffe169', '#805b10', '#a47e1b', '#dbb42c', '#dbb42c'],
      // 17 8/1: urban. zero net change.
      ['#dc97ff', '#310055', '#d283ff', '#ab51e3', '#8b2fc9', '#bd68ee', '#d283ff'],
      // 18 9/0: rural. zero net change.
      ['#e8f3fe', '#0f3375', '#cce4fd', '#1557c0', '#196bde', '#a4cefc', '#77b6fb'],
      // 19 9/1: rural. zero net change.
      // ---------------------------------
      // todo: should only need 19 elements. but errors. quickfix for now
      ['#FF3C38', '#ED254E', '#ef4043', '#be1e2d', '#ff0059', '#C7381D', '#FF1053']
    ];

    return colorPalettes[paletteNumber][colorPos];
  }

  function returnRepresentationSelector(uint256 seed) public pure returns (uint8) {
    uint256 arbitrarySelector = seed % 13;

    if (arbitrarySelector < 1) {
      // raw
      return 0;
    } else if (arbitrarySelector < 3) {
      // static
      return 1;
    } else if (arbitrarySelector < 5) {
      // animated arrows
      return 2;
    } else if (arbitrarySelector < 9) {
      // animated blocks
      return 3;
    } else if (arbitrarySelector < 10) {
      // animated pixel
      return 4;
    } else {
      // animated circle
      return 5;
    }
  }

  function renderDefs(
    string memory backgroundColor,
    string memory aliveColor,
    string memory deadColor,
    string memory bornColor,
    string memory perishedColor,
    uint256 representation,
    string memory scaling
  ) public pure returns (bytes memory) {
    // render defs for: live, dead

    bytes memory defs;

    // start of defs
    defs = abi.encodePacked('<defs>');

    // add dummy animation for timing offset
    defs = abi.encodePacked(defs, '<animate id="aa" begin="0s"/>');
    // add live

    if (representation < 5) {
      // if
      defs = abi.encodePacked(
        defs,
        '<rect id="l0" width="',
        scaling,
        '" height="',
        scaling,
        '" fill="',
        aliveColor,
        '"></rect>'
      );
      // add dead
      defs = abi.encodePacked(
        defs,
        '<rect id="d0" width="',
        scaling,
        '" height="',
        scaling,
        '" fill="',
        deadColor,
        '"></rect>'
      );
    } else {
      // circle
      defs = abi.encodePacked(defs, '<circle id="l0" r="18" fill="', aliveColor, '"></circle>');
      // add dead
      defs = abi.encodePacked(defs, '<circle id="d0" r="18" fill="', deadColor, '"></circle>');
    }

    if (representation == 1) {
      // case: static
      // add perished fields
      defs = abi.encodePacked(
        defs,
        '<rect id="b0" width="',
        scaling,
        '" height="',
        scaling,
        '" fill="',
        perishedColor,
        '"></rect>'
      );

      defs = abi.encodePacked(defs, '<g id="p0"><use href="#d0" /> <use href="#pp" /></g>');

      // add born fields
      defs = abi.encodePacked(
        defs,
        '<rect id="b0" width="',
        scaling,
        '" height="',
        scaling,
        '" fill="',
        bornColor,
        '"></rect>'
      );
    }

    defs = abi.encodePacked(defs, '</defs>');

    return defs;
  }

  function returnPerishedAnimation(
    string memory deadColor,
    string memory perishedColor,
    uint256 i,
    uint256 j,
    uint256 representation,
    uint8 bornCounter,
    uint8 perishedCounter
  ) public pure returns (string memory) {
    //
    if (representation == 4) {
      // going for a matrix style animation
      return
        string(
          abi.encodePacked(
            '<animate attributeType="XML" attributeName="fill" values="',
            deadColor,
            ';',
            perishedColor,
            ';',
            deadColor,
            ';',
            deadColor,
            '" dur="8s" begin="aa.begin +',
            Strings.toString(i * 8 + j),
            's" ',
            'repeatCount="indefinite"/>'
          )
        );
    } else if (representation >= 2 && representation != 4) {
      return
        string(
          abi.encodePacked(
            '<animate attributeType="XML" attributeName="fill" values="',
            deadColor,
            ';',
            perishedColor,
            ';',
            deadColor,
            ';',
            deadColor,
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
    string memory aliveColor,
    string memory bornColor,
    uint256 i,
    uint256 j,
    uint256 representation,
    uint8 bornCounter,
    uint8 perishedCounter
  ) public pure returns (string memory) {
    //

    if (representation == 4) {
      // going for a matrix style animation
      return
        string(
          abi.encodePacked(
            '<animate attributeType="XML" attributeName="fill" values="',
            aliveColor,
            ';',
            bornColor,
            ';',
            aliveColor,
            ';',
            aliveColor,
            '" dur="8s" begin="aa.begin +',
            Strings.toString(i * 8 + j),
            's" ',
            'repeatCount="indefinite"/>'
          )
        );
    } else if (representation >= 2 && representation != 4) {
      return
        string(
          abi.encodePacked(
            '<animate attributeType="XML" attributeName="fill" values="',
            aliveColor,
            ';',
            bornColor,
            ';',
            aliveColor,
            ';',
            aliveColor,
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
      return 'signs';
    } else if (representation == 5) {
      return 'circle';
    }
  }

  function timeOffsetMap(uint256 elementIndex) public pure returns (string memory) {
    // workaround:
    // return a string for animation timing offset as getting fractions (float, fixed) is tricky to convert to strings
    // mapping for all possible elements (64)

    if (elementIndex == 0) {
      return '0.5';
    } else if (elementIndex == 1) {
      return '1';
    } else if (elementIndex == 2) {
      return '1.5';
    } else if (elementIndex == 3) {
      return '2';
    } else if (elementIndex == 5) {
      return '2.5';
    } else if (elementIndex == 6) {
      return '3';
    } else if (elementIndex == 7) {
      return '3.5';
    } else if (elementIndex == 8) {
      return '4';
    } else if (elementIndex == 9) {
      return '4.5';
    } else if (elementIndex == 10) {
      return '5';
    } else if (elementIndex == 11) {
      return '5.5';
    } else if (elementIndex == 12) {
      return '6';
    } else if (elementIndex == 13) {
      return '6.5';
    } else if (elementIndex == 14) {
      return '7';
    } else if (elementIndex == 15) {
      return '7.5';
    } else if (elementIndex == 16) {
      return '8';
    } else if (elementIndex == 17) {
      return '8.5';
    } else if (elementIndex == 18) {
      return '9';
    } else if (elementIndex == 19) {
      return '9.5';
    } else if (elementIndex == 20) {
      return '10';
    } else if (elementIndex == 21) {
      return '10.5';
    } else if (elementIndex == 22) {
      return '';
    } else if (elementIndex == 23) {
      return '';
    } else if (elementIndex == 24) {
      return '';
    } else if (elementIndex == 25) {
      return '';
    } else if (elementIndex == 26) {
      return '';
    } else if (elementIndex == 27) {
      return '';
    } else if (elementIndex == 28) {
      return '';
    } else if (elementIndex == 29) {
      return '';
    } else if (elementIndex == 30) {
      return '';
    } else if (elementIndex == 31) {
      return '';
    } else if (elementIndex == 32) {
      return '';
    } else if (elementIndex == 33) {
      return '';
    } else if (elementIndex == 34) {
      return '';
    } else if (elementIndex == 35) {
      return '';
    } else if (elementIndex == 36) {
      return '';
    } else if (elementIndex == 37) {
      return '';
    } else if (elementIndex == 38) {
      return '';
    } else if (elementIndex == 39) {
      return '';
    } else if (elementIndex == 40) {
      return '';
    } else if (elementIndex == 41) {
      return '';
    } else if (elementIndex == 42) {
      return '';
    } else if (elementIndex == 43) {
      return '';
    } else if (elementIndex == 44) {
      return '';
    } else if (elementIndex == 45) {
      return '';
    } else if (elementIndex == 46) {
      return '';
    } else if (elementIndex == 47) {
      return '';
    } else if (elementIndex == 48) {
      return '';
    } else if (elementIndex == 49) {
      return '';
    } else if (elementIndex == 50) {
      return '';
    } else if (elementIndex == 51) {
      return '';
    } else if (elementIndex == 52) {
      return '';
    } else if (elementIndex == 53) {
      return '';
    } else if (elementIndex == 54) {
      return '';
    } else if (elementIndex == 55) {
      return '';
    } else if (elementIndex == 56) {
      return '';
    } else if (elementIndex == 57) {
      return '';
    } else if (elementIndex == 58) {
      return '';
    } else if (elementIndex == 59) {
      return '';
    } else if (elementIndex == 60) {
      return '';
    } else if (elementIndex == 61) {
      return '';
    } else if (elementIndex == 62) {
      return '';
    } else if (elementIndex == 63) {
      return '';
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
    if (popUp == 0 && !densityThreshold) {
      // population low & shrinking
      // rural
      // bad times
      times = diffThreshold ? 1 : 0; // rapid change : slow change
    } else if (popUp == 0 && densityThreshold) {
      // population high & shrinking
      // urban
      // good times
      times = diffThreshold ? 3 : 2; // rapid change : slow change
    } else if (popUp == 1 && !densityThreshold) {
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
    // what logic for naming could be applied?
    string memory timesName;
    if (times == 0) {
      timesName = 't0';
    } else if (times == 1) {
      timesName = 't1';
    } else if (times == 2) {
      timesName = 't2';
    } else if (times == 3) {
      timesName = 't3';
    } else if (times == 4) {
      timesName = 't4';
    } else if (times == 5) {
      timesName = 't5';
    } else if (times == 6) {
      timesName = 't6';
    } else if (times == 7) {
      timesName = 't7';
    } else if (times == 8) {
      timesName = 't8';
    } else if (times == 9) {
      timesName = 't9';
    } else if (times == 10) {
      timesName = 't10';
    } else if (times == 11) {
      timesName = 't11';
    } else if (times == 12) {
      timesName = 't12';
    } else if (times == 13) {
      timesName = 't13';
    } else if (times == 14) {
      timesName = 't14';
    } else if (times == 15) {
      timesName = 't15';
    } else if (times == 16) {
      timesName = 't16';
    } else if (times == 17) {
      timesName = 't17';
    } else if (times == 18) {
      timesName = 't18';
    } else if (times == 19) {
      timesName = 't19';
    }

    return timesName;
  }

  function generateAttributeString(
    uint256 times,
    uint8 representation,
    string calldata generation,
    uint256 populationDensity,
    uint256 birthCount,
    uint256 deathCount,
    string calldata trend,
    uint256 popDiff
  ) public pure returns (string memory) {
    string memory timesName = generateTimesName(times);
    string memory representationName = generateRepresentationName(representation);

    string memory attributeString = string(
      abi.encodePacked(
        ' "attributes": [{"trait_type": "generation", "value": "#',
        generation,
        '"},',
        '{"trait_type" : "density", "value": "',
        Strings.toString(populationDensity),
        '"},',
        '{"trait_type" : "births", "value": "',
        Strings.toString(birthCount),
        '"},',
        '{"trait_type" : "deaths", "value": "',
        Strings.toString(deathCount),
        '"},',
        '{"trait_type" : "trend", "value": "',
        trend,
        '"},',
        '{"trait_type" : "population_difference", "value": "',
        Strings.toString(popDiff),
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

  function renderGameSquare(Structs.CellData memory CellData, Structs.ColorMap memory colorMap)
    internal
    pure
    returns (string memory)
  {
    //
    string memory square;
    string memory i_scale;
    string memory j_scale;

    if (CellData.representation < 5) {
      // rectangle case
      i_scale = Strings.toString(CellData.i * CellData.unitScale + 2 + 20);
      j_scale = Strings.toString(CellData.j * CellData.unitScale + 2 + 20);
    } else {
      // circle case
      i_scale = Strings.toString(CellData.i * CellData.unitScale + 20 + 20);
      j_scale = Strings.toString(CellData.j * CellData.unitScale + 20 + 20);
    }

    if (CellData.alive && !CellData.hasChanged) {
      // was alive last round
      square = string(
        abi.encodePacked('<use href="#l0" ', 'x="', i_scale, '" y="', j_scale, '" />')
      );
    } else if (CellData.alive && CellData.hasChanged) {
      // case: new born
      if (CellData.representation == 0) {
        // raw
        square = string(
          abi.encodePacked('<use href="#l0" ', 'x="', i_scale, '" y="', j_scale, '" />')
        );
      } else if (CellData.representation == 1) {
        square = string(
          abi.encodePacked('<use href="#b0" ', 'x="', i_scale, '" y="', j_scale, '" />')
        );
      } else if (CellData.representation == 2) {
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
            returnBornAnimation(
              colorMap.aliveColor,
              colorMap.bornColor,
              CellData.i,
              CellData.j,
              CellData.representation,
              CellData.bornCounter,
              CellData.perishedCounter
            ),
            '</polygon>',
            '</g>'
          )
        );
      } else if (CellData.representation == 3) {
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
            returnBornAnimation(
              colorMap.aliveColor,
              colorMap.bornColor,
              CellData.i,
              CellData.j,
              CellData.representation,
              CellData.bornCounter,
              CellData.perishedCounter
            ),
            '</polygon>',
            '</g>'
          )
        );
      } else if (CellData.representation == 4) {
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<use href="#l0" />',
            // '<polygon points="0,36 18,36 18,0 36,0 36,18 0,18" fill="', // to be replaced
            // '<polygon points="15,5 21,5 21,15 31,15 31,21 21,21, 21,31 15,31 15,21 5,21 5,15 15,15" fill="',
            '<polygon points="16,6 20,6 20,16 30,16 30,20 20,20 20,30 16,30 16,20 6,20 6,16, 16,16" fill="',
            colorMap.bornColor,
            '">',
            returnBornAnimation(
              colorMap.aliveColor,
              colorMap.bornColor,
              CellData.i,
              CellData.j,
              CellData.representation,
              CellData.bornCounter,
              CellData.perishedCounter
            ),
            '</polygon>',
            '</g>'
          )
        );
      } else if (CellData.representation == 5) {
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
            returnBornAnimation(
              colorMap.aliveColor,
              colorMap.bornColor,
              CellData.i,
              CellData.j,
              CellData.representation,
              CellData.bornCounter,
              CellData.perishedCounter
            ),
            '</circle>',
            '</g>'
          )
        );
      }
    } else if (!CellData.alive && !CellData.hasChanged) {
      // case: didn't exist in previous round
      square = string(
        abi.encodePacked('<use href="#d0" ', 'x="', i_scale, '" y="', j_scale, '" />')
      );
    } else if (!CellData.alive && CellData.hasChanged) {
      // case: died this round
      if (CellData.representation == 0) {
        square = string(
          abi.encodePacked('<use href="#d0" ', 'x="', i_scale, '" y="', j_scale, '" />')
        );
      } else if (CellData.representation == 1) {
        square = string(
          abi.encodePacked('<use href="#p0" transform="translate(', i_scale, ',', j_scale, ')" />')
        );
      } else if (CellData.representation == 2) {
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
            returnPerishedAnimation(
              colorMap.deadColor,
              colorMap.perishedColor,
              CellData.i,
              CellData.j,
              CellData.representation,
              CellData.bornCounter,
              CellData.perishedCounter
            ),
            '</polygon>',
            '</g>'
          )
        );
      } else if (CellData.representation == 3) {
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
            returnPerishedAnimation(
              colorMap.deadColor,
              colorMap.perishedColor,
              CellData.i,
              CellData.j,
              CellData.representation,
              CellData.bornCounter,
              CellData.perishedCounter
            ),
            '</polygon>',
            '</g>'
          )
        );
      } else if (CellData.representation == 4) {
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<use href="#d0" />',
            // '<polygon points="0,36 18,36 18,0 36,0 36,18 0,18" fill="', // 18,3 15,9 9,9 6,15 9,21 15,21 21,15 21,9 15,3
            // '<polygon points="6,6 10,6 18,14 26,6 30,6 22,18 30,30 26,30 18,22 10,30 6,30 14,18" fill="',
            '<polygon points="6,6 10,6 18,16 26,6 30,6 20,18 30,30 26,30 18,20 10,30 6,30 16,18" fill="',
            colorMap.perishedColor,
            '">',
            returnPerishedAnimation(
              colorMap.deadColor,
              colorMap.perishedColor,
              CellData.i,
              CellData.j,
              CellData.representation,
              CellData.bornCounter,
              CellData.perishedCounter
            ),
            '</polygon>',
            '</g>'
          )
        );
      } else if (CellData.representation == 5) {
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
            returnPerishedAnimation(
              colorMap.deadColor,
              colorMap.perishedColor,
              CellData.i,
              CellData.j,
              CellData.representation,
              CellData.bornCounter,
              CellData.perishedCounter
            ),
            '</circle>',
            '</g>'
          )
        );
      }
    }

    return square;
  }
}
