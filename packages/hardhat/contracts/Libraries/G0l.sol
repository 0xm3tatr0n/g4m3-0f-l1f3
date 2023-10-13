pragma solidity >=0.7.0 <0.8.0;
// pragma solidity ^0.8.6;
// pragma abicoder v2;
// pragma abicoder v2;
import '@openzeppelin/contracts/utils/Strings.sol';
import {Structs} from './Structs.sol';
import 'hardhat/console.sol';

library G0l {
  function returnColor(
    uint256 paletteNumber,
    uint256 colorPos
  ) public pure returns (string memory) {
    // console.log('palette no, pos: ', paletteNumber, colorPos);
    string[7][31] memory colorPalettes = [
      // background, live, dead, born0, born1, perished0, perished1
      // 0 0/0: bad. rural, shrinking slowly:
      ['#ffffff', '#000000', '#ffffff', '#000000', '#000000', '#ffffff', '#ffffff'],
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
      ['#201335', '#f78154', '#201335', '#5fad56', '#4d9078', '#b4436c', '#b4436c'],
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
      ['#FF3C38', '#ED254E', '#ef4043', '#be1e2d', '#ff0059', '#C7381D', '#FF1053'],
      // 20
      ['#0c226e', '#000000', '#6f6269', '#fafeff', '#ccc0c4', '#3b63ba', '#7c9ace'],
      // 21
      ['#005F73', '#EE9B00', '#001219', '#0A9396', '#94D2BD', '#AE2012', '#9B2226'],
      // 22
      ['#CAFFBF', '#FDFFB6', '#FFC6FF', '#CAFFBF', '#CAFFBF', '#A0C4FF', '#BDB2FF'],
      // 23
      ['#52B788', '#081C15', '#D8F3DC', '#52B788', '#40916C', '#1B4332', '#2D6A4F'],
      // 24
      ['#80B918', '#FFFF3F', '#2B9348', '#DDDF00', '#EEEF20', '#007F5F', '#55A630'],
      // 25
      ['#92F2E8', '#F72585', '#159F91', '#B5179E', '#7209B7', '#1BCCBA', '#1EE3CF'],
      // 26
      ['#6A040F', '#03071E', '#D00000', '#FBB539', '#F48C06', '#370617', '#9D0208'],
      // 27
      ['#c9a83b', '#070707', '#5d4218', '#1e180b', '#564015', '#836024', '#b99c4c'],
      // 28
      ['#806537', '#3d4a4e', '#cfd3e8', '#637aa7', '#35456a', '#718abf', '#7c9ace'],
      // 29
      ['#d0cdcd', '#927961', '#3b456f', '#e3e3e7', '#232627', '#b795a4', '#a87b82'],
      // fillers
      // 30
      ['#681211', '#fde18d', '#371011', '#634382', '#865a97', '#f04726', '#d05c65']
    ];

    return colorPalettes[paletteNumber][colorPos];
  }

  function representationAttributes(uint256 seed) public pure returns (uint8, uint8, uint8) {
    uint8 shape;
    uint8 speed;
    uint8 pattern;

    {
      // shape: 0: circle, 1: block, 2: triangle, 3: squares (alive) & circles (dead), 4: circles (alive) & squares (dead)
      uint8 selector = uint8(seed % 19);

      if (selector < 5) {
        // circle
        shape = 0;
      } else if (selector < 10) {
        // block
        shape = 1;
      } else if (selector < 11) {
        shape = 2;
      } else if (selector < 15) {
        // triangle
        shape = 3;
      } else {
        shape = 4;
      }
    }

    {
      // speed: 0: raw, 1: static, 2: animated1, 3: animated2, 4: animated3
      uint8 selector = uint8(seed % 23);
      if (selector < 5) {
        speed = 0;
      } else if (selector < 10) {
        speed = 1;
      } else if (selector < 13) {
        speed = 2;
      } else if (selector < 17) {
        speed = 3;
      } else {
        speed = 4;
      }
    }

    {
      if (speed <= 1) {
        pattern = 0;
      } else {
        uint8 selector = uint8(seed % 31);
        if (selector < 10) {
          pattern = 1;
        } else if (selector < 19) {
          pattern = 2;
        } else {
          pattern = 3;
        }
      }
    }

    return (shape, speed, pattern);
  }

  function renderDefs(
    // string memory backgroundColor,
    string memory aliveColor,
    string memory deadColor,
    string memory bornColor,
    string memory perishedColor,
    uint8 shape,
    uint8 speed,
    string memory scaling
  ) public pure returns (bytes memory) {
    // render defs for: live, dead

    bytes memory defs;

    // start of defs
    defs = abi.encodePacked('<defs>');

    // add dummy animation for timing offset
    defs = abi.encodePacked(defs, '<animate id="aa" begin="0s"/>');
    // add live

    if (shape == 0) {
      // circle
      defs = abi.encodePacked(defs, '<circle id="l" r="18" fill="', aliveColor, '"></circle>');
      // add dead
      defs = abi.encodePacked(defs, '<circle id="d" r="18" fill="', deadColor, '"></circle>');
    } else if (shape == 1 || shape == 2) {
      // blocks & triangles
      defs = abi.encodePacked(
        defs,
        '<rect id="l" width="',
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
        '<rect id="d" width="',
        scaling,
        '" height="',
        scaling,
        '" fill="',
        deadColor,
        '"></rect>'
      );
    } else if (shape == 3) {
      // shape 3: alive: square, dead: circle
      defs = abi.encodePacked(
        defs,
        '<rect id="l" width="',
        scaling,
        '" height="',
        scaling,
        '" fill="',
        aliveColor,
        '"></rect>'
      );

      defs = abi.encodePacked(defs, '<circle id="d" r="18" fill="', deadColor, '"></circle>');
    } else if (shape == 4) {
      // shape 3: alive: square, dead: circle
      defs = abi.encodePacked(
        defs,
        '<rect id="d" width="',
        scaling,
        '" height="',
        scaling,
        '" fill="',
        deadColor,
        '"></rect>'
      );

      defs = abi.encodePacked(defs, '<circle id="l" r="18" fill="', aliveColor, '"></circle>');
    }

    if (speed == 1) {
      // case: static
      if (shape == 0) {
        // circles
        defs = abi.encodePacked(defs, '<circle id="b" r="18" fill="', bornColor, '"></circle>');
        defs = abi.encodePacked(defs, '<circle id="p" r="18" fill="', perishedColor, '"></circle>');
      } else if (shape == 1 || shape == 2) {
        // blocks & triangles
        defs = abi.encodePacked(
          defs,
          '<rect id="b" width="',
          scaling,
          '" height="',
          scaling,
          '" fill="',
          bornColor,
          '"></rect>'
        );

        defs = abi.encodePacked(
          defs,
          '<rect id="p" width="',
          scaling,
          '" height="',
          scaling,
          '" fill="',
          perishedColor,
          '"></rect>'
        );
      } else if (shape == 3) {
        // mixed shapes
        defs = abi.encodePacked(
          defs,
          '<rect id="b" width="',
          scaling,
          '" height="',
          scaling,
          '" fill="',
          bornColor,
          '"></rect>'
        );

        defs = abi.encodePacked(defs, '<circle id="p" r="18" fill="', perishedColor, '"></circle>');
      } else if (shape == 4) {
        defs = abi.encodePacked(
          defs,
          '<rect id="p" width="',
          scaling,
          '" height="',
          scaling,
          '" fill="',
          perishedColor,
          '"></rect>'
        );

        defs = abi.encodePacked(defs, '<circle id="b" r="18" fill="', bornColor, '"></circle>');
      }
    }

    defs = abi.encodePacked(defs, '</defs>');

    return defs;
  }

  function renderAnimation(
    string memory primaryColor,
    string memory secondaryColor,
    uint8 pattern,
    uint8 speed,
    uint8 i,
    uint8 j,
    uint8 bornCounter,
    uint8 perishedCounter
  )
    public
    pure
    returns (
      // bool alive
      string memory
    )
  {
    //
    if (speed <= 1) {
      // raw or static
      return '';
    } else {
      if (pattern == 1) {
        uint8 dur;
        if (speed == 2) {
          dur = 4;
        } else if (speed == 3) {
          dur = 3;
        } else if (speed == 4) {
          dur = 1;
        }
        return
          string(
            abi.encodePacked(
              '<animate attributeType="XML" attributeName="fill" values="',
              primaryColor,
              ';',
              secondaryColor,
              ';',
              primaryColor,
              ';',
              primaryColor,
              '" dur="',
              Strings.toString(dur),
              's" begin="aa.begin +',
              timeOffsetMap(bornCounter + perishedCounter),
              's" ',
              'repeatCount="indefinite"/>'
            )
          );
      } else if (pattern == 2) {
        uint8 dur;
        if (speed == 2) {
          dur = 2;
        } else if (speed == 3) {
          dur = 1;
        } else if (speed == 4) {
          dur = 0;
        }
        return
          string(
            abi.encodePacked(
              '<animate attributeType="XML" attributeName="fill" values="',
              primaryColor,
              ';',
              secondaryColor,
              ';',
              primaryColor,
              ';',
              primaryColor,
              '" dur="',
              Strings.toString(dur),
              '.',
              Strings.toString((i * j) % 10),
              's" repeatCount="indefinite"/>'
            )
          );
      } else if (pattern == 3) {
        uint8 dur;
        // string memory offset;
        if (speed == 2) {
          dur = 3;
        } else if (speed == 3) {
          dur = 2;
        } else if (speed == 4) {
          dur = 1;
        }

        return
          string(
            abi.encodePacked(
              '<animate attributeType="XML" attributeName="fill" values="',
              secondaryColor,
              ';',
              primaryColor,
              ';',
              secondaryColor,
              ';',
              secondaryColor,
              '" dur="',
              Strings.toString(dur),
              's" begin="aa.begin +',
              '0',
              's" ',
              'repeatCount="indefinite"/>'
            )
          );
      }
    }
  }

  function getTrends(
    uint8 bornCells,
    uint8 perishedCells
  ) internal pure returns (Structs.Trends memory) {
    Structs.Trends memory trends;
    trends.births = bornCells;
    trends.deaths = perishedCells;

    if (bornCells > perishedCells) {
      trends.up = 1;
      trends.popDiff = bornCells - perishedCells;
    } else if (bornCells < perishedCells) {
      trends.up = 0;
      trends.popDiff = uint8(-int8(bornCells - perishedCells));
    } else {
      trends.up = 99;
      trends.popDiff = 0;
    }

    return trends;
  }

  function timeOffsetMap(uint256 x) public pure returns (string memory) {
    uint256 result = (x + 1) / 2;
    uint256 integerPart = result;
    uint256 decimalPart = (((x + 1) % 2) * 10) / 2;

    bytes memory integerPartBytes = _uintToBytes(integerPart);
    bytes memory decimalPartBytes = _uintToBytes(decimalPart);

    bytes memory resultBytes = abi.encodePacked(integerPartBytes, '.', decimalPartBytes);

    return string(resultBytes);
  }

  function _uintToBytes(uint256 n) private pure returns (bytes memory) {
    if (n == 0) {
      return '0';
    }

    uint256 j = n;
    uint256 len = 0;
    while (j != 0) {
      len++;
      j /= 10;
    }

    bytes memory bstr = new bytes(len);
    uint256 k = len - 1;
    while (n != 0) {
      bstr[k--] = bytes1(uint8(48 + (n % 10)));
      n /= 10;
    }

    return bstr;
  }

  function generateTimesNumber(
    // individual variables to make function public
    uint8 popUp,
    uint8 popDiff,
    uint8 density,
    uint256 seed
  ) public pure returns (uint8) {
    // (replicating current state to get started somewhere. better would be better.)
    // should commit to final number of pallettes: 24?
    // trying to figure out dramaturgy of times
    bool densityThreshold = density >= 25;

    // determin if population difference is above threshold
    bool diffThreshold = popDiff > 3;

    // initialize times variable
    uint8 times = 0;
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
    times = uint8((times * 2) + ((seed % 2)));

    return times;
  }

  function generateTimesName(uint256 times) public pure returns (string memory) {
    // what logic for naming could be applied?
    string memory timesName;
    if (times == 0) {
      timesName = 'Zero';
    } else if (times == 1) {
      timesName = 'Serenity';
    } else if (times == 2) {
      timesName = 'Chartreuse';
    } else if (times == 3) {
      timesName = 'Coral';
    } else if (times == 4) {
      timesName = 'Sprout';
    } else if (times == 5) {
      timesName = 'Electric';
    } else if (times == 6) {
      timesName = 'Blaze';
    } else if (times == 7) {
      timesName = 'Bubblegum';
    } else if (times == 8) {
      timesName = 'Rustic';
    } else if (times == 9) {
      timesName = 'Peppermint';
    } else if (times == 10) {
      timesName = 'Harvest';
    } else if (times == 11) {
      timesName = 'Nebula';
    } else if (times == 12) {
      timesName = 'Enchanted Forest';
    } else if (times == 13) {
      timesName = 'Cosmic Candy';
    } else if (times == 14) {
      timesName = 'Shadows';
    } else if (times == 15) {
      timesName = 'Ocean';
    } else if (times == 16) {
      timesName = 'Goldrush';
    } else if (times == 17) {
      timesName = 'Lavender';
    } else if (times == 18) {
      timesName = 'Seaside';
    } else if (times == 19) {
      timesName = 'Red Alert';
    } else if (times == 20) {
      timesName = 'Earthrise';
    } else if (times == 21) {
      timesName = 'Autumn';
    } else if (times == 22) {
      timesName = 'Popart';
    } else if (times == 23) {
      timesName = 'Forest';
    } else if (times == 24) {
      timesName = 'Spring Fling';
    } else if (times == 25) {
      timesName = "Nebula's Edge";
    } else if (times == 26) {
      timesName = 'Fire & Earth';
    } else if (times == 27) {
      timesName = 'Porto';
    } else if (times == 28) {
      timesName = 'Aljezur';
    } else if (times == 29) {
      timesName = 'Bromance';
    } else if (times == 30) {
      timesName = 'kepler 16b';
    }

    return timesName;
  }

  function generateShapeName(uint8 shape) public pure returns (string memory) {
    string memory name;
    if (shape == 0) {
      name = 'circles';
    } else if (shape == 1) {
      name = 'squares';
    } else if (shape == 2) {
      name = 'pointers';
    } else if (shape == 3) {
      name = 'I/O';
    } else if (shape == 4) {
      name = 'Oi!';
    }

    return name;
  }

  function generateSpeedName(uint8 shape) public pure returns (string memory) {
    string memory name;
    if (shape == 0) {
      name = 'raw';
    } else if (shape == 1) {
      name = 'static';
    } else if (shape == 2) {
      name = 'slomo';
    } else if (shape == 3) {
      name = 'realtime';
    } else if (shape == 4) {
      name = 'montage';
    }

    return name;
  }

  function generatePatternName(uint8 shape) public pure returns (string memory) {
    string memory name;
    if (shape == 0) {
      name = 'none';
    } else if (shape == 1) {
      name = 'random';
    } else if (shape == 2) {
      name = 'matrix';
    } else if (shape == 3) {
      name = 'obvious';
    }

    return name;
  }

  function generateAttributeString(
    uint8 times,
    string calldata epoch,
    uint16 generation,
    uint8 populationDensity,
    uint8 birthCount,
    uint8 deathCount,
    uint8 shape,
    uint8 speed,
    uint8 pattern,
    string calldata trend
  ) public pure returns (string memory) {
    bytes memory attributeBytes;

    {
      attributeBytes = abi.encodePacked(
        ' "attributes": [{"trait_type": "epoch", "value": "#',
        epoch,
        '"},',
        '{"trait_type" : "generation", "value": "',
        Strings.toString(uint256(generation)),
        '"},',
        '{"trait_type" : "density", "value": "',
        Strings.toString(populationDensity),
        '"},',
        '{"trait_type" : "births", "value": "',
        Strings.toString(birthCount),
        '"},',
        '{"trait_type" : "deaths", "value": "',
        Strings.toString(deathCount),
        '"},'
        '{"trait_type" : "diff", "value": "',
        trend,
        '"},'
      );
    }

    {
      attributeBytes = abi.encodePacked(
        attributeBytes,
        '{"trait_type" : "times", "value": "',
        generateTimesName(times),
        '"},',
        '{"trait_type" : "shape", "value": "',
        generateShapeName(shape),
        '"},',
        '{"trait_type" : "speed", "value": "',
        generateSpeedName(speed),
        '"},',
        '{"trait_type" : "pattern", "value": "',
        generatePatternName(pattern),
        '"}',
        '],'
      );
    }

    return string(attributeBytes);
  }

  function renderUseTag(
    string memory href,
    string memory i_scale,
    string memory j_scale
  ) public pure returns (string memory) {
    return
      string(abi.encodePacked('<use href="', href, '" ', 'x="', i_scale, '" y="', j_scale, '" />'));
  }

  function renderAnimatedCell(
    string memory href,
    string memory i_scale,
    string memory j_scale,
    string memory primaryColor,
    string memory secondaryColor,
    Structs.CellData memory CellData
  ) internal pure returns (string memory) {
    // pattern
    string memory cell;

    uint8 shapeOverride;

    // override shape to mix squares & circles
    if (CellData.shape == 3) {
      if (CellData.alive) {
        shapeOverride = 1;
      } else {
        shapeOverride = 0;
      }
    } else if (CellData.shape == 4) {
      if (CellData.alive) {
        shapeOverride = 0;
      } else {
        shapeOverride = 1;
      }
    } else {
      shapeOverride = CellData.shape;
    }

    {
      cell = string(abi.encodePacked('<g transform="translate(', i_scale, ',', j_scale, ')">'));
    }

    {
      string[3] memory shapeTagOpen = [
        '<circle r="18" fill="',
        '<polygon points="0,0 0,36 36,36 36,0" fill="',
        '<polygon points="36,0 36,36 0,0" fill="'
      ];
      cell = string(
        abi.encodePacked(cell, '<use href="', href, '" />', shapeTagOpen[shapeOverride])
      );
    }

    {
      string[3] memory shapeTagClose = ['</circle>', '</polygon>', '</polygon>'];
      string memory animation = renderAnimation(
        primaryColor,
        secondaryColor,
        CellData.pattern,
        CellData.speed,
        CellData.i,
        CellData.j,
        CellData.bornCounter,
        CellData.perishedCounter
        // CellData.alive
      );

      cell = string(
        abi.encodePacked(cell, primaryColor, '">', animation, shapeTagClose[shapeOverride], '</g>')
      );
    }

    return cell;
  }

  function _calculateScales(
    Structs.CellData memory CellData
  )
    internal
    pure
    returns (
      string memory i_scale,
      string memory j_scale,
      string memory i_scale_a,
      string memory j_scale_a
    )
  {
    uint256 base_i = uint256(CellData.i) * uint256(CellData.unitScale);
    uint256 base_j = uint256(CellData.j) * uint256(CellData.unitScale);
    uint256 offset = (CellData.shape == 0 || CellData.shape == 4) ? 40 : 22;
    uint256 offset_a = (CellData.shape == 0 || CellData.shape == 4) ? 22 : 40;

    i_scale = Strings.toString(base_i + offset);
    j_scale = Strings.toString(base_j + offset);
    i_scale_a = Strings.toString(base_i + offset_a);
    j_scale_a = Strings.toString(base_j + offset_a);
  }

  function _renderAlive(
    Structs.CellData memory CellData,
    string memory i_scale,
    string memory j_scale,
    Structs.ColorMap memory colorMap
  ) internal pure returns (string memory) {
    if (CellData.speed == 0) {
      return renderUseTag('#l', i_scale, j_scale);
    } else if (CellData.speed == 1) {
      return renderUseTag('#b', i_scale, j_scale);
    } else {
      return
        renderAnimatedCell(
          '#b',
          i_scale,
          j_scale,
          colorMap.bornColor,
          colorMap.aliveColor,
          CellData
        );
    }
  }

  function _renderDead(
    Structs.CellData memory CellData,
    string memory i_scale,
    string memory j_scale,
    string memory i_scale_a,
    string memory j_scale_a,
    Structs.ColorMap memory colorMap
  ) internal pure returns (string memory) {
    if (CellData.speed == 0) {
      return
        renderUseTag(
          '#d',
          (CellData.shape == 3 || CellData.shape == 4) ? i_scale_a : i_scale,
          (CellData.shape == 3 || CellData.shape == 4) ? j_scale_a : j_scale
        );
    } else if (CellData.speed == 1) {
      return
        renderUseTag(
          '#p',
          (CellData.shape == 3 || CellData.shape == 4) ? i_scale_a : i_scale,
          (CellData.shape == 3 || CellData.shape == 4) ? j_scale_a : j_scale
        );
    } else {
      return
        renderAnimatedCell(
          '#p',
          (CellData.shape == 3 || CellData.shape == 4) ? i_scale_a : i_scale,
          (CellData.shape == 3 || CellData.shape == 4) ? j_scale_a : j_scale,
          colorMap.perishedColor,
          colorMap.deadColor,
          CellData
        );
    }
  }

  function renderGameSquare(
    Structs.CellData memory CellData,
    Structs.ColorMap memory colorMap
  ) internal pure returns (string memory) {
    (
      string memory i_scale,
      string memory j_scale,
      string memory i_scale_a,
      string memory j_scale_a
    ) = _calculateScales(CellData);

    if (CellData.alive) {
      if (!CellData.hasChanged) {
        return renderUseTag('#l', i_scale, j_scale);
      } else {
        return _renderAlive(CellData, i_scale, j_scale, colorMap);
      }
    } else {
      if (!CellData.hasChanged) {
        return
          renderUseTag(
            '#d',
            (CellData.shape == 3 || CellData.shape == 4) ? i_scale_a : i_scale,
            (CellData.shape == 3 || CellData.shape == 4) ? j_scale_a : j_scale
          );
      } else {
        return _renderDead(CellData, i_scale, j_scale, i_scale_a, j_scale_a, colorMap);
      }
    }
  }
}
