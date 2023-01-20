pragma solidity >=0.7.0 <0.8.0;
pragma abicoder v2;
//SPDX-License-Identifier: MIT

// imports
import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
// import {G0l, BitOps} from './Libraries.sol';
import './Libraries/G0l.sol';
import './Libraries/BitOps.sol';
import {Structs} from './StructsLibrary.sol';

// just for testing external libraries
// import './Foo.sol';

contract G4m3 {
  using Counters for Counters.Counter;
  using Strings for uint256;
  // constants
  uint256 internal constant dim = 8;
  uint256 internal constant scale = 40;
  string s_scale = Strings.toString(scale - 4);

  // state variables
  Counters.Counter internal _tokenIds;
  Counters.Counter internal _currentGeneration;
  mapping(uint256 => uint256) internal tokenGridStatesInt;
  mapping(uint256 => uint256) internal tokenGeneration;
  uint256 internal gameStateInt;

  // counter handling functions
  // workaround since _tokenIds.increment() doesn't work in YourCollectibles..abi
  function tokenIdsIncrement() internal {
    _tokenIds.increment();
  }

  function tokenIdsCurrent() internal view returns (uint256) {
    return _tokenIds.current();
  }

  function generationIncrement() internal {
    _currentGeneration.increment();
  }

  function generationCurrent() internal view returns (uint256) {
    return _currentGeneration.current();
  }

  // g4m3 state view functions
  function showStateInt() public view returns (uint256) {
    return gameStateInt;
  }

  // state muting functions
  function _initState() internal {
    // set generation
    _currentGeneration.increment();

    // temporary storage
    bool[dim][dim] memory results;

    // generate some "randomness"
    bytes32 seedBytes = keccak256(
      abi.encodePacked(
        address(this),
        _currentGeneration.current(),
        'bar',
        blockhash(block.number - 1),
        block.timestamp
      )
    );

    uint256 r = uint256(seedBytes);
    // uint256[] memory b;
    uint256 gridInt = r;
    for (uint256 i = 0; i < dim; i += 1) {
      uint8 m = uint8(r >> (i * 8));

      for (uint256 j = 0; j < dim; j += 1) {
        // generate row seed
        uint256 s = uint256(keccak256(abi.encodePacked(Strings.toString(m), address(this))));

        uint8 n = uint8(s >> (j * 8));
        bool result;
        if (n > 125) {
          result = true;
        } else {
          result = false;
        }

        results[i][j] = result;
        gridInt = BitOps.setBooleaOnIndex(gridInt, (i * dim) + j, result);
      }
    }

    gameStateInt = gridInt;
  }

  function _iterateState() internal {
    // play game of life
    uint256 N = dim;

    bool[dim][dim] memory oldGameStateFromInt = wordToGrid(gameStateInt);
    bool[dim][dim] memory newGameStateFromInt = oldGameStateFromInt;

    for (uint256 i = 0; i < dim; i += 1) {
      for (uint256 j = 0; j < dim; j += 1) {
        uint256 total = uint256(
          _b2u(oldGameStateFromInt[uint256((i - 1) % N)][uint256((j - 1) % N)]) +
            _b2u(oldGameStateFromInt[uint256((i - 1) % N)][j]) +
            _b2u(oldGameStateFromInt[uint256((i - 1) % N)][uint256((j + 1) % N)]) +
            _b2u(oldGameStateFromInt[i][uint256((j + 1) % N)]) +
            _b2u(oldGameStateFromInt[uint256((i + 1) % N)][uint256((j + 1) % N)]) +
            _b2u(oldGameStateFromInt[uint256((i + 1) % N)][j]) +
            _b2u(oldGameStateFromInt[uint256((i + 1) % N)][uint256((j - 1) % N)]) +
            _b2u(oldGameStateFromInt[i][uint256((j - 1) % N)])
        );

        if (oldGameStateFromInt[i][j] == true) {
          if (total < 2 || total > 3) {
            // todo: change this!
            newGameStateFromInt[i][j] = false;
          }
        } else {
          if (total == 3) {
            // todo: change this!
            newGameStateFromInt[i][j] = true;
          }
        }

        // grid total. pyhton example:
        // copy grid since we require 8 neighbors
        // for calculation and we go line by line
        // newGrid = grid.copy()
        // for i in range(N):
        //     for j in range(N):

        //         # compute 8-neighbor sum
        //         # using toroidal boundary conditions - x and y wrap around
        //         # so that the simulation takes place on a toroidal surface.
        //         total = int((grid[i, (j-1)%N] + grid[i, (j+1)%N] +
        //                      grid[(i-1)%N, j] + grid[(i+1)%N, j] +
        //                      grid[(i-1)%N, (j-1)%N] + grid[(i-1)%N, (j+1)%N] +
        //                      grid[(i+1)%N, (j-1)%N] + grid[(i+1)%N, (j+1)%N])/255)

        //         # apply Conway's rules
        //         if grid[i, j]  == ON:
        //             if (total < 2) or (total > 3):
        //                 newGrid[i, j] = OFF
        //         else:
        //             if total == 3:
        //                 newGrid[i, j] = ON

        // # update data
        // img.set_data(newGrid)
        // grid[:] = newGrid[:]
        // return img,
      }
    }

    // check if generation ended (no change between iteration)
    // naming suboptimal:
    // gameStateIntOld --> old N-2
    // gameStateInt --> old N-1
    // gameStateIntNew --> current
    uint256 gameStateIntNew = gridToWord(newGameStateFromInt);

    if (_tokenIds.current() > 2) {
      // game advanced enough to look back 2 periods
      uint256 gameStateIntOld = tokenGridStatesInt[_tokenIds.current()];
      if (gameStateInt == gameStateIntNew || gameStateIntOld == gameStateIntNew) {
        // init new state
        _initState();
      } else {
        gameStateInt = gameStateIntNew;
      }
    } else {
      // we can't look back 2 periods yet..
      if (gameStateInt == gameStateIntNew) {
        // init new state
        _initState();
      } else {
        gameStateInt = gameStateIntNew;
      }
    }
  }

  // data render functions (state viewing functions, strictly speaking)
  // function getTrends(uint256 bornCells, uint256 perishedCells)
  //   internal
  //   pure
  //   returns (Structs.Trends memory)
  // {
  //   Structs.Trends memory trends;
  //   trends.births = bornCells;
  //   trends.deaths = perishedCells;

  //   if (bornCells > perishedCells) {
  //     trends.up = 1;
  //     trends.popDiff = bornCells - perishedCells;
  //   } else if (bornCells < perishedCells) {
  //     trends.up = 0;
  //     trends.popDiff = uint256(-int256(bornCells - perishedCells));
  //   } else {
  //     trends.up = 99;
  //     trends.popDiff = 0;
  //   }

  //   return trends;
  // }

  function generateMetadata(uint256 id) internal view returns (Structs.MetaData memory) {
    Structs.MetaData memory metadata;
    metadata.populationDensity = BitOps.getCountOfOnBits(tokenGridStatesInt[id]);
    metadata.name = string(abi.encodePacked('gam3 0f l1f3 #', id.toString()));
    metadata.description = string(abi.encodePacked('gam3 0f l1f3 #', id.toString()));
    metadata.generation = Strings.toString(tokenGeneration[id]);

    // "arbitrary" value to mix things up (not random because deterministic)
    uint256 arbitrary = uint256(
      keccak256(abi.encodePacked(metadata.generation, metadata.description))
    );
    metadata.seed = arbitrary;
    uint256 arbitrarySelector = arbitrary % 13;

    if (arbitrarySelector < 1) {
      metadata.representation = 0;
    } else if (arbitrarySelector < 3) {
      metadata.representation = 1;
    } else {
      metadata.representation = 2;
    }
    // get data for births & deaths
    uint256 stateDiff;
    if (id > 1) {
      stateDiff = tokenGridStatesInt[id - 1] ^ tokenGridStatesInt[id];

      uint256 bornCells = BitOps.getCountOfOnBits(tokenGridStatesInt[id] & stateDiff);
      uint256 perishedCells = BitOps.getCountOfOnBits(~tokenGridStatesInt[id] & stateDiff);
      // set counts
      metadata.birthCount = bornCells;
      metadata.deathCount = perishedCells;

      Structs.Trends memory populationTrends = G0l.getTrends(bornCells, perishedCells);

      // determine prosperity levels
      metadata.popDiff = populationTrends.popDiff;

      if (populationTrends.up == 1) {
        metadata.trend = 'up';
        if (populationTrends.popDiff > 2) {
          metadata.times = 1;
        } else {
          metadata.times = 0;
        }
      } else if (populationTrends.up == 0) {
        metadata.trend = 'down';
        if (populationTrends.popDiff > 2) {
          metadata.times = 2;
        } else {
          metadata.times = 0;
        }
      } else {
        metadata.trend = 'none';
        metadata.times = 3;
      }
    }

    return metadata;
  }

  // function generateAttributeString(Structs.MetaData memory metadata)
  //   internal
  //   pure
  //   returns (string memory)
  // {
  //   string memory timesName;
  //   if (metadata.times == 0) {
  //     timesName = 'stable';
  //   } else if (metadata.times == 1) {
  //     timesName = 'good';
  //   } else if (metadata.times == 2) {
  //     timesName = 'bad';
  //   } else if (metadata.times == 3) {
  //     timesName = 'zero';
  //   }

  //   string memory representationName;

  //   if (metadata.representation == 0) {
  //     representationName = 'raw';
  //   } else if (metadata.representation == 1) {
  //     representationName = 'static';
  //   } else if (metadata.representation == 2) {
  //     representationName = 'animated';
  //   }

  //   string memory attributeString = string(
  //     abi.encodePacked(
  //       '", "attributes": [{"trait_type": "generation", "value": "#',
  //       metadata.generation,
  //       '"},',
  //       '{"trait_type" : "density", "value": "',
  //       Strings.toString(metadata.populationDensity),
  //       '"},',
  //       '{"trait_type" : "births", "value": "',
  //       Strings.toString(metadata.birthCount),
  //       '"},',
  //       '{"trait_type" : "deaths", "value": "',
  //       Strings.toString(metadata.deathCount),
  //       '"},',
  //       '{"trait_type" : "trend", "value": "',
  //       metadata.trend,
  //       '"},',
  //       '{"trait_type" : "population_difference", "value": "',
  //       Strings.toString(metadata.popDiff),
  //       '"},',
  //       '{"trait_type" : "times", "value": "',
  //       timesName,
  //       '"},',
  //       '{"trait_type" : "representation", "value": "',
  //       representationName,
  //       '"}',
  //       '],'
  //     )
  //   );
  //   return attributeString;
  // }

  function generateSVGofTokenById(uint256 id) internal view returns (string memory) {
    // get token gameState as int, convert to grid
    string memory svg = string(
      abi.encodePacked(
        '<svg width="320" height="320" xmlns="http://www.w3.org/2000/svg">',
        renderGameGrid(id),
        '</svg>'
      )
    );

    return svg;
  }

  // function generateColorMap(Structs.MetaData memory metadata)
  //   internal
  //   pure
  //   returns (Structs.ColorMap memory)
  // {
  //   Structs.ColorMap memory colorMap;

  //   uint256 selectedColorScheme = metadata.populationDensity < 25
  //     ? metadata.times
  //     : metadata.times + 4;

  //   // modify selected palette
  //   if (metadata.seed % 42 < 13) {
  //     selectedColorScheme = selectedColorScheme + 4;
  //   }

  //   colorMap.backgroundColor = G0l.returnColor(selectedColorScheme, 0);
  //   colorMap.aliveColor = G0l.returnColor(selectedColorScheme, 1);
  //   colorMap.deadColor = G0l.returnColor(selectedColorScheme, 2);

  //   // handle birth's intensity
  //   if (metadata.birthCount < 6) {
  //     colorMap.bornColor = G0l.returnColor(selectedColorScheme, 3);
  //   } else {
  //     colorMap.bornColor = G0l.returnColor(selectedColorScheme, 4);
  //   }

  //   // handle death intensity
  //   if (metadata.deathCount < 6) {
  //     colorMap.perishedColor = G0l.returnColor(selectedColorScheme, 5);
  //   } else {
  //     colorMap.perishedColor = G0l.returnColor(selectedColorScheme, 6);
  //   }

  //   return colorMap;
  // }

  function renderDefs(Structs.ColorMap memory colorMap, uint256 representation)
    internal
    view
    returns (bytes memory)
  {
    // render defs for: live, dead

    bytes memory defs;

    defs = abi.encodePacked('<defs>');
    // add live
    defs = abi.encodePacked(
      defs,
      '<rect id="l0" width="',
      s_scale,
      '" height="',
      s_scale,
      '" fill="',
      colorMap.aliveColor,
      '"></rect>'
    );
    // add dead
    defs = abi.encodePacked(
      defs,
      '<rect id="d0" width="',
      s_scale,
      '" height="',
      s_scale,
      '" fill="',
      colorMap.deadColor,
      '"></rect>'
    );

    if (representation == 1) {
      // case: static
      // add perished fields
      defs = abi.encodePacked(
        defs,
        '<polygon id="pp" points="0,36 36,36 0,0" fill="',
        colorMap.perishedColor,
        '" />'
      );

      defs = abi.encodePacked(defs, '<g id="p0"><use href="#d0" /> <use href="#pp" /></g>');

      // add born fields
      defs = abi.encodePacked(
        defs,
        '<rect id="b0" width="',
        s_scale,
        '" height="',
        s_scale,
        '" fill="',
        colorMap.bornColor,
        '"></rect>'
      );
    }

    defs = abi.encodePacked(defs, '</defs>');

    return defs;
  }

  function renderGameSquare(
    bool alive,
    bool hasChanged,
    uint256 i,
    uint256 j,
    Structs.ColorMap memory colorMap,
    uint256 representation
  ) internal view returns (string memory) {
    //
    string memory square;
    string memory i_scale = Strings.toString(i * scale + 2);
    string memory j_scale = Strings.toString(j * scale + 2);

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
        // static
        square = string(
          abi.encodePacked(
            '<g transform="translate(',
            i_scale,
            ',',
            j_scale,
            ')">',
            '<rect width="',
            s_scale,
            '" height="',
            s_scale,
            '" ',
            ' fill="',
            colorMap.bornColor,
            '"',
            '/>',
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
      }
    }

    return square;
  }

  function renderGameGrid(uint256 id) public view returns (string memory) {
    // render that thing
    bool[dim][dim] memory grid = wordToGrid(tokenGridStatesInt[id]);
    string[] memory squares = new string[](dim * dim);
    uint256 slotCounter = 0;
    uint256 stateDiff;

    // figure out which cells have changed in this round
    if (id > 1) {
      // case: not the first item (todo: catch generation changes)
      stateDiff = tokenGridStatesInt[id - 1] ^ tokenGridStatesInt[id];
    } else {
      // no changes since first born
    }

    // determine color map
    Structs.MetaData memory metaData = generateMetadata(id);
    Structs.ColorMap memory colorMap = G0l.generateColorMap(metaData);

    for (uint256 i = 0; i < grid.length; i += 1) {
      //
      bool[dim] memory row = grid[i];
      for (uint256 j = 0; j < row.length; j += 1) {
        bool alive = grid[i][j];
        string memory square;

        // check for stateDiff
        bool hasChanged = BitOps.getBooleanFromIndex(stateDiff, (i * dim + j));
        square = renderGameSquare(alive, hasChanged, i, j, colorMap, metaData.representation);

        squares[slotCounter] = square;
        slotCounter += 1;
      }
    }

    // combine array of squares into single bytes array

    bytes memory output;
    // add general svg, e.g. background
    output = renderDefs(colorMap, metaData.representation);
    output = abi.encodePacked(
      output,
      '<rect width="100%" height="100%" fill="',
      colorMap.backgroundColor,
      '" />'
    );
    for (uint256 i = 0; i < squares.length; i += 1) {
      output = abi.encodePacked(output, squares[i]);
    }

    return string(output);
  }

  // utility functions
  function _b2u(bool input) internal pure returns (uint256) {
    return input ? 1 : 0;
  }

  function gridToWord(bool[dim][dim] memory grid) internal pure returns (uint256) {
    // convert bool[][] to word (after completing iterating state)
    uint256 word;
    for (uint256 i = 0; i < dim; i += 1) {
      for (uint256 j = 0; j < dim; j += 1) {
        word = BitOps.setBooleaOnIndex(word, (i * dim + j), grid[i][j]);
      }
    }
    return word;
  }

  function wordToGrid(uint256 word) internal pure returns (bool[dim][dim] memory) {
    // convert word to bool[][] (prior to iterate state)
    bool[dim][dim] memory grid;
    for (uint256 i = 0; i < dim; i += 1) {
      for (uint256 j = 0; j < dim; j += 1) {
        //
        grid[i][j] = BitOps.getBooleanFromIndex(word, (i * dim + j));
      }
    }

    return grid;
  }
}
