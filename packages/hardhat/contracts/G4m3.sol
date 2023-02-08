pragma solidity >=0.7.0 <0.8.0;
pragma abicoder v2;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import 'base64-sol/base64.sol';

import './Libraries/HexStrings.sol';
// import './G4m3.sol';

import './Libraries/G0l.sol';
import './Libraries/BitOps.sol';
// import './ToColor.sol';
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721 16631332

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two
import {Structs} from './Libraries/Structs.sol';

contract G4m3 is ERC721, Pausable, Ownable {
  using Strings for uint256;
  using HexStrings for uint160;
  using Counters for Counters.Counter;
  using Strings for uint256;

  // using ToColor for bytes3;

  constructor() ERC721('g4m3 0f l1f3', 'g0l') {
    createTime = block.timestamp;
    _initState();
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  // events
  event Withdrawal(address to, uint256 amount);

  // constants
  uint256 public constant maxItems = 10;
  uint256 public constant mintPrice = 0.01 ether;
  uint256 internal constant scale = 40;
  string s_scale = Strings.toString(scale - 4);

  // variables
  uint256 private minted4free = 0;
  uint256 private createTime;

  // Game state
  Counters.Counter internal _tokenIds;
  Counters.Counter internal _currentGeneration;
  mapping(uint256 => uint256) internal tokenGridStatesInt;
  mapping(uint256 => uint256) internal tokenGeneration;
  uint256 internal gameStateInt;

  // Functions: Mint
  function mintItem(address mintTo) public payable whenNotPaused returns (uint256) {
    require(msg.value >= mintPrice, 'funds');
    // tokenIdsIncrement();
    _tokenIds.increment();

    uint256 id = _tokenIds.current();
    _mint(mintTo, id);
    _iterateState();

    // store token states
    tokenGridStatesInt[id] = gameStateInt;
    tokenGeneration[id] = _currentGeneration.current();

    return id;
  }

  function mintMany(address mintTo, uint256 noItems) public payable whenNotPaused {
    require(noItems <= maxItems, 'too many mints');
    require(msg.value >= mintPrice * noItems, 'funds');

    for (uint256 i = 0; i < noItems; i++) {
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(mintTo, id);
      _iterateState();

      // store token states
      tokenGridStatesInt[id] = gameStateInt;
      tokenGeneration[id] = _currentGeneration.current();
    }
  }

  function mintForFree(address mintTo, uint256 noItems) public onlyOwner {
    // owner mint allocation of 1 item / day
    uint256 currentAlloc = (block.timestamp - createTime) / (1 days);
    require((minted4free + noItems) <= currentAlloc, 'not enough free mints');

    for (uint256 i = 0; i < noItems; i++) {
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(mintTo, id);
      minted4free += 1;
      _iterateState();

      // store token states
      tokenGridStatesInt[id] = gameStateInt;
      tokenGeneration[id] = _currentGeneration.current();
    }
  }

  // State changing
  function _initState() internal {
    // set generation
    _currentGeneration.increment();

    // temporary storage
    bool[8][8] memory results;

    // generate some "randomness"
    bytes32 seedBytes = keccak256(
      abi.encodePacked(
        address(this),
        _currentGeneration.current(),
        blockhash(block.number - 1),
        block.timestamp
      )
    );

    uint256 r = uint256(seedBytes);
    // uint256[] memory b;
    uint256 gridInt = r;
    for (uint256 i = 0; i < 8; i += 1) {
      uint8 m = uint8(r >> (i * 8));

      for (uint256 j = 0; j < 8; j += 1) {
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
        gridInt = BitOps.setBooleaOnIndex(gridInt, (i * 8) + j, result);
      }
    }

    gameStateInt = gridInt;
  }

  function _iterateState() internal {
    // play game of life
    uint256 N = 8;

    bool[8][8] memory oldGameStateFromInt = BitOps.wordToGrid(gameStateInt);
    bool[8][8] memory newGameStateFromInt = oldGameStateFromInt;

    for (uint256 i = 0; i < 8; i += 1) {
      for (uint256 j = 0; j < 8; j += 1) {
        uint256 total = uint256(
          BitOps._b2u(oldGameStateFromInt[uint256((i - 1) % N)][uint256((j - 1) % N)]) +
            BitOps._b2u(oldGameStateFromInt[uint256((i - 1) % N)][j]) +
            BitOps._b2u(oldGameStateFromInt[uint256((i - 1) % N)][uint256((j + 1) % N)]) +
            BitOps._b2u(oldGameStateFromInt[i][uint256((j + 1) % N)]) +
            BitOps._b2u(oldGameStateFromInt[uint256((i + 1) % N)][uint256((j + 1) % N)]) +
            BitOps._b2u(oldGameStateFromInt[uint256((i + 1) % N)][j]) +
            BitOps._b2u(oldGameStateFromInt[uint256((i + 1) % N)][uint256((j - 1) % N)]) +
            BitOps._b2u(oldGameStateFromInt[i][uint256((j - 1) % N)])
        );

        if (oldGameStateFromInt[i][j] == true) {
          if (total < 2 || total > 3) {
            newGameStateFromInt[i][j] = false;
          }
        } else {
          if (total == 3) {
            newGameStateFromInt[i][j] = true;
          }
        }
      }
    }

    // check if generation ended (no change between iteration)
    // naming suboptimal:
    // gameStateIntOld --> old N-2
    // gameStateInt --> old N-1
    // gameStateIntNew --> current
    uint256 gameStateIntNew = BitOps.gridToWord(newGameStateFromInt);

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

  // Token Rendering

  function tokenURI(uint256 id) public view override returns (string memory) {
    require(_exists(id), 'nt');
    string memory image = Base64.encode(bytes(generateSVGofTokenById(id)));
    Structs.MetaData memory metadata = generateMetadata(id);

    return
      string(
        abi.encodePacked(
          'data:application/json;base64,',
          Base64.encode(
            bytes(
              abi.encodePacked(
                '{"name":"',
                metadata.name,
                '", "description":"',
                metadata.description,
                '",',
                G0l.generateAttributeString(
                  metadata.times,
                  metadata.representation,
                  metadata.generation,
                  metadata.populationDensity,
                  metadata.birthCount,
                  metadata.deathCount,
                  metadata.trend,
                  metadata.popDiff
                ),
                '"owner":"',
                (uint160(ownerOf(id))).toHexString(20),
                '", "image": "',
                'data:image/svg+xml;base64,',
                image,
                '"}'
              )
            )
          )
        )
      );
  }

  function generateSVGofTokenById(uint256 id) internal view returns (string memory) {
    // get token gameState as int, convert to grid
    string memory svg = string(
      abi.encodePacked(
        '<svg width="360" height="360" xmlns="http://www.w3.org/2000/svg">',
        renderGameGrid(id),
        '</svg>'
      )
    );

    return svg;
  }

  function generateColorMap(Structs.MetaData memory metadata)
    internal
    pure
    returns (Structs.ColorMap memory)
  {
    Structs.ColorMap memory colorMap;
    // modify selected palette
    colorMap.backgroundColor = G0l.returnColor(metadata.times, 0);
    colorMap.aliveColor = G0l.returnColor(metadata.times, 1);
    colorMap.deadColor = G0l.returnColor(metadata.times, 2);

    // handle birth's intensity
    if (metadata.birthCount < 6) {
      colorMap.bornColor = G0l.returnColor(metadata.times, 3);
    } else {
      colorMap.bornColor = G0l.returnColor(metadata.times, 4);
    }

    // handle death intensity
    if (metadata.deathCount < 6) {
      colorMap.perishedColor = G0l.returnColor(metadata.times, 5);
    } else {
      colorMap.perishedColor = G0l.returnColor(metadata.times, 6);
    }

    return colorMap;
  }

  function renderDefs(Structs.ColorMap memory colorMap, uint256 representation)
    internal
    view
    returns (bytes memory)
  {
    // render defs for: live, dead

    bytes memory defs;

    defs = abi.encodePacked('<defs>');
    // add live

    if (representation < 5) {
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
    } else {
      // circle
      defs = abi.encodePacked(
        defs,
        '<circle id="l0" r="18" fill="',
        colorMap.aliveColor,
        '"></circle>'
      );
      // add dead
      defs = abi.encodePacked(
        defs,
        '<circle id="d0" r="18" fill="',
        colorMap.deadColor,
        '"></circle>'
      );
    }

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

  function renderGameGrid(uint256 id) public view returns (string memory) {
    // render that thing
    bool[8][8] memory grid = BitOps.wordToGrid(tokenGridStatesInt[id]);
    string[] memory squares = new string[](8 * 8);
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
    Structs.ColorMap memory colorMap = generateColorMap(metaData);

    for (uint256 i = 0; i < grid.length; i += 1) {
      //
      bool[8] memory row = grid[i];
      for (uint256 j = 0; j < row.length; j += 1) {
        bool alive = grid[i][j];
        string memory square;

        // check for stateDiff
        bool hasChanged = BitOps.getBooleanFromIndex(stateDiff, (i * 8 + j));
        square = G0l.renderGameSquare(
          alive,
          hasChanged,
          i,
          j,
          colorMap,
          metaData.representation,
          scale
        );

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

  function generateMetadata(uint256 id) internal view returns (Structs.MetaData memory) {
    Structs.MetaData memory metadata;
    metadata.populationDensity = BitOps.getCountOfOnBits(tokenGridStatesInt[id]);
    metadata.name = string(abi.encodePacked('g4m3 0f l1f3 #', id.toString()));
    metadata.description = string(abi.encodePacked('g4m3 0f l1f3 #', id.toString()));
    metadata.generation = Strings.toString(tokenGeneration[id]);

    // "arbitrary" value to mix things up (not random because deterministic)
    metadata.seed = uint256(keccak256(abi.encodePacked(metadata.generation, metadata.description)));
    uint256 arbitrarySelector = metadata.seed % 13;

    if (arbitrarySelector < 1) {
      // raw
      metadata.representation = 0;
    } else if (arbitrarySelector < 3) {
      // static
      metadata.representation = 1;
    } else if (arbitrarySelector < 9) {
      // animated arrows
      metadata.representation = 2;
    } else if (arbitrarySelector < 11) {
      // animated blocks
      metadata.representation = 3;
    } else if (arbitrarySelector < 12) {
      // animated pixel
      metadata.representation = 4;
    } else {
      // animated circle
      metadata.representation = 5;
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
      metadata.times = uint8(
        G0l.generateTimesNumber(
          populationTrends.up,
          populationTrends.popDiff,
          metadata.seed,
          metadata.populationDensity
        )
      );

      if (populationTrends.up == 1) {
        metadata.trend = 'up';
      } else if (populationTrends.up == 0) {
        metadata.trend = 'down';
      } else {
        metadata.trend = 'constant';
      }
    }

    return metadata;
  }

  // Withdraw
  function withdrawAmount(uint256 amount) public onlyOwner {
    require(amount <= address(this).balance, 'withdraw amnt too high');
    msg.sender.transfer(amount);
    emit Withdrawal(msg.sender, amount);
  }

  receive() external payable {}
}
