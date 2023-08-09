//            ___             _____   _____   __   _  __    __  _____
//           /   |           |____ | |  _  | / _| | |/  |  / _||____ |
//    __ _  / /| | _ __ ___      / / | |/' || |_  | |`| | | |_     / /
//   / _` |/ /_| || '_ ` _ \     \ \ |  /| ||  _| | | | | |  _|    \ \
//  | (_| |\___  || | | | | |.___/ / \ |_/ /| |   | |_| |_| |  .___/ /
//   \__, |    |_/|_| |_| |_|\____/   \___/ |_|   |_|\___/|_|  \____/
//    __/ |
//   |___/

// This project is for experimentation. Should something breaks, I'm sorry. But have been warned.
// SPDX-License-Identifier: MIT
// https://twitter.com/0xm3tatr0n

pragma solidity >=0.7.0 <0.8.0;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
// import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
// import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import 'base64-sol/base64.sol';

import './Libraries/HexStrings.sol';

import './Libraries/G0l.sol';
import './Libraries/BitOps.sol';
import {Structs} from './Libraries/Structs.sol';

contract G4m3 is ERC721, Ownable {
  using Strings for uint256;
  using HexStrings for uint160;
  // using Counters for Counters.Counter;
  using Strings for uint256;

  constructor() ERC721('g4m3 0f l1f3', 'g0l') {
    createTime = block.timestamp;
    _initState();
  }

  // function pause() public onlyOwner {
  //   _pause();
  // }

  // function unpause() public onlyOwner {
  //   _unpause();
  // }

  // events
  event Withdrawal(address to, uint256 amount);

  // constants
  // uint256 public constant maxItems = 10;
  uint256 public constant mintOnePrice = 0.01 ether;
  uint256 public constant mintPackPrice = 0.025 ether;
  uint8 public constant maxEpochs = 10;
  uint8 internal constant scale = 40;
  uint8 internal constant N = 8;
  string s_scale = Strings.toString(scale - 4);

  // variables
  uint256 private minted4free = 0;
  uint256 private createTime;

  // Game state
  uint16 internal _tokenIds = 0;
  uint8 internal _currentEpoch;
  uint16 internal _currentGeneration = 0;
  // mapping(uint256 => uint64) internal tokenGridStatesInt;
  // mapping(uint256 => uint8) internal tokenEpoch;
  // mapping(uint256 => uint16) internal tokenGeneration;

  // TODO: remove mappings for tokenGridStatesInt, tokenEpoch and tokenGeneration with the one mapping below.
  mapping(uint256 => uint256) internal tokenState;

  uint64 internal gameStateInt;

  // Functions: Mint
  function mintItem(address mintTo) public payable returns (uint256 lastTokenId) {
    require(msg.value >= mintOnePrice, 'funds');
    return _mintBase(mintTo);
  }

  function mintPack(address mintTo) public payable {
    require(msg.value >= mintPackPrice, 'funds');

    for (uint256 i = 0; i < 5; i++) {
      _mintBase(mintTo);
    }
  }

  function mintForFree(address mintTo, uint256 noItems) public onlyOwner {
    // owner mint allocation of 1 item / day
    uint256 currentAlloc = (block.timestamp - createTime) / (1 days);
    require((minted4free + noItems) <= currentAlloc, 'no free mints');

    for (uint256 i = 0; i < noItems; i++) {
      _mintBase(mintTo);
      minted4free += 1;
    }
  }

  // internal mint function called by all of the above
  function _mintBase(address to) private returns (uint256 lastTokenId) {
    // this assumes criteria like eligibility of minting & funding have been checked before!
    _tokenIds += 1;
    _iterateState();

    // store token states
    // tokenGridStatesInt[_tokenIds] = gameStateInt;
    // tokenEpoch[_tokenIds] = _currentEpoch;
    // tokenGeneration[_tokenIds] = _currentGeneration;

    // trying to simplify the above
    tokenState[_tokenIds] = BitOps.packState(gameStateInt, _currentEpoch, _currentGeneration);

    _mint(to, _tokenIds);
    return _tokenIds;
  }

  // g4m3 0f l1f3 state functions
  function _initState() internal {
    require(_currentEpoch < maxEpochs, 'minted out');
    // set epoch
    _currentEpoch += 1;
    // set generation
    _currentGeneration = 0;

    // temporary storage
    bool[8][8] memory results;

    // generate some "randomness"
    bytes32 seedBytes = keccak256(
      abi.encodePacked(address(this), _currentEpoch, blockhash(block.number - 1), block.timestamp)
    );

    uint64 r = uint64(uint256(seedBytes));
    uint64 gridInt = r;
    for (uint256 i = 0; i < 8; i += 1) {
      uint8 m = uint8(r >> (i * 8));
      // generate row seed
      uint256 s = uint256(keccak256(abi.encodePacked(Strings.toString(m), address(this))));

      for (uint256 j = 0; j < 8; j += 1) {
        uint8 n = uint8(s >> (j * 8));
        bool result = n > 125;

        results[i][j] = result;
        gridInt = BitOps.setBooleaOnIndex64(gridInt, uint64((i * 8) + j), result);
      }
    }

    gameStateInt = gridInt;
  }

  // original iterate state function
  function _iterateState() internal {
    if (_currentGeneration >= 1023) {
      // start new epoch
      _initState();
    } else {
      // play game of life
      bool[N][N] memory oldGameStateFromInt = BitOps.wordToGrid(gameStateInt);
      bool[N][N] memory newGameStateFromInt = oldGameStateFromInt;

      for (uint256 i = 0; i < N; i += 1) {
        for (uint256 j = 0; j < N; j += 1) {
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
      // gameStateIntOldOld --> old N-3
      // gameStateIntOld --> old N-2
      // gameStateInt --> old N-1
      // gameStateIntNew --> current
      uint256 gameStateIntNew = BitOps.gridToWord(newGameStateFromInt);

      if (_tokenIds > 3) {
        // game advanced enough to look back 3 periods
        // uint256 gameStateIntOldOld = tokenGridStatesInt[_tokenIds - 1];
        // uint256 gameStateIntOld = tokenGridStatesInt[_tokenIds];

        // instead of using the states above, we need to retrieve from tokenState
        uint64 gameStateIntOld;
        uint64 gameStateIntOldOld;
        (gameStateIntOld, , ) = BitOps.unpackState(tokenState[_tokenIds]);
        (gameStateIntOldOld, , ) = BitOps.unpackState(tokenState[_tokenIds - 1]);

        if (
          gameStateInt == gameStateIntNew ||
          gameStateIntOld == gameStateIntNew ||
          gameStateIntOldOld == gameStateIntNew
        ) {
          // init new state
          _initState();
        } else {
          _currentGeneration += 1;
          gameStateInt = uint64(gameStateIntNew);
        }
      } else {
        _currentGeneration += 1;
        gameStateInt = uint64(gameStateIntNew);
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
                  metadata.epoch,
                  metadata.generation,
                  metadata.populationDensity,
                  metadata.birthCount,
                  metadata.deathCount,
                  metadata.popDiff,
                  metadata.shape,
                  metadata.speed,
                  metadata.pattern
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
    string memory svg = string(
      abi.encodePacked(
        '<svg width="360" height="360" xmlns="http://www.w3.org/2000/svg">',
        renderGameGrid(id),
        '</svg>'
      )
    );

    return svg;
  }

  function generateColorMap(
    Structs.MetaData memory metadata
  ) internal pure returns (Structs.ColorMap memory) {
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

  function renderGameGrid(uint256 id) public view returns (string memory) {
    // render that thing
    uint64 gameState;
    (gameState, , ) = BitOps.unpackState(tokenState[id]);
    bool[N][N] memory grid = BitOps.wordToGrid(gameState);
    string[] memory squares = new string[](N * N);
    uint256 slotCounter = 0;
    uint256 stateDiff;
    Structs.CellData memory CellData;

    // figure out which cells have changed in this round
    if (id > 1) {
      // case: not the first item (todo: catch generation changes)
      uint64 gameStateOld;
      (gameStateOld, , ) = BitOps.unpackState(tokenState[id - 1]);
      stateDiff = gameStateOld ^ gameState;
    } else {
      // no changes since first born
    }

    // determine color map
    Structs.MetaData memory metaData = generateMetadata(id);
    Structs.ColorMap memory colorMap = generateColorMap(metaData);

    // pass metadata to celldata
    CellData.shape = metaData.shape;
    CellData.speed = metaData.speed;
    CellData.pattern = metaData.pattern;

    // adding counters to keep track of born / perished
    CellData.bornCounter = 0;
    CellData.perishedCounter = 0;

    // packing representation (present in metaData) into CellData struct for stacking reasons
    CellData.unitScale = scale;

    for (uint8 i = 0; i < grid.length; i += 1) {
      //
      bool[8] memory row = grid[i];
      for (uint8 j = 0; j < row.length; j += 1) {
        CellData.i = i;
        CellData.j = j;
        CellData.alive = grid[i][j];
        string memory square;

        // check for stateDiff
        CellData.hasChanged = BitOps.getBooleanFromIndex(stateDiff, (i * 8 + j));

        // update tracking counters
        if (CellData.hasChanged && CellData.alive) {
          CellData.bornCounter += 1;
        } else if (CellData.hasChanged && !CellData.alive) {
          CellData.perishedCounter += 1;
        }

        square = G0l.renderGameSquare(CellData, colorMap);

        squares[slotCounter] = square;
        slotCounter += 1;
      }
    }

    // combine array of squares into single bytes array

    bytes memory output;
    // add general svg, e.g. background
    output = G0l.renderDefs(
      // colorMap.backgroundColor,
      colorMap.aliveColor,
      colorMap.deadColor,
      colorMap.bornColor,
      colorMap.perishedColor,
      metaData.shape,
      metaData.speed,
      s_scale
    );
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
    uint64 gameState;
    uint8 epoch;
    uint16 generation;
    (gameState, epoch, generation) = BitOps.unpackState(tokenState[id]);
    metadata.epoch = Strings.toString(epoch);
    metadata.generation = generation;
    metadata.populationDensity = BitOps.getCountOfOnBits(gameState);
    metadata.name = string(
      abi.encodePacked(
        'g4m3 0f l1f3 #',
        id.toString(),
        ' ',
        Strings.toString(epoch),
        '/',
        uint256(generation).toString()
      )
    );
    metadata.description = string(abi.encodePacked('g4m3 0f l1f3 #', id.toString()));

    // "arbitrary" value to mix things up (not random because deterministic)
    metadata.seed = uint256(keccak256(abi.encodePacked(metadata.generation, metadata.description)));
    // get data for births & deaths
    uint256 stateDiff;
    if (id > 1 && metadata.generation != 0) {
      uint64 prevTokenState;
      (prevTokenState, , ) = BitOps.unpackState(tokenState[id - 1]);
      stateDiff = prevTokenState ^ gameState;

      uint8 bornCells = BitOps.getCountOfOnBits(gameState & stateDiff);
      uint8 perishedCells = BitOps.getCountOfOnBits(~gameState & stateDiff);
      // set counts
      metadata.birthCount = bornCells;
      metadata.deathCount = perishedCells;

      Structs.Trends memory populationTrends = G0l.getTrends(bornCells, perishedCells);

      // determine prosperity levels
      metadata.popDiff = populationTrends.popDiff;
      metadata.times =
        uint8(
          G0l.generateTimesNumber(
            populationTrends.up,
            populationTrends.popDiff,
            metadata.populationDensity,
            metadata.seed
          )
        ) +
        epoch;

      if (populationTrends.up == 1) {
        metadata.trend = 'up';
      } else if (populationTrends.up == 0) {
        metadata.trend = 'down';
      } else {
        metadata.trend = 'constant';
      }
    } else {
      // fallback for new generations
      metadata.birthCount = 0;
      metadata.deathCount = 0;
      metadata.popDiff = 0;
      metadata.trend = 'fresh';
      metadata.times = 0;
    }

    // dummy population of new representation data
    (metadata.shape, metadata.speed, metadata.pattern) = G0l.representationAttributes(
      metadata.seed
    );

    // override for testing:
    // metadata.shape = 4;
    // metadata.pattern = 1;
    // metadata.speed = 3;

    return metadata;
  }

  // Withdraw
  function drainFunds() public onlyOwner {
    uint256 amount = address(this).balance;
    msg.sender.transfer(amount);
    emit Withdrawal(msg.sender, amount);
  }

  receive() external payable {}
}
