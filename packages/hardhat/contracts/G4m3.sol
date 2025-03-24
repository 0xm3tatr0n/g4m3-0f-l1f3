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
// https://github.com/0xm3tatr0n
// https://twitter.com/0xm3tatr0n

pragma solidity ^0.8.20;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import 'base64-sol/base64.sol';
import './Libraries/HexStrings.sol';
import './Libraries/G0l.sol';
import './Libraries/BitOps.sol';
import {Structs} from './Libraries/Structs.sol';

contract G4m3 is ERC721, Ownable {
  // useing
  using Strings for uint256;
  using HexStrings for uint160;

  uint256 public deployTime;

  constructor() ERC721('g4m3 0f l1f3', 'l1f3') {
    deployTime = block.timestamp;
    _initState();
  }

  // modifiers
  modifier publicMintLive() {
    require(block.timestamp >= deployTime + 1 weeks, 'mint not yet public');
    _;
  }

  // events
  event Withdrawal(address to, uint256 amount);

  // constants
  // uint256 public constant maxItems = 10;
  uint256 public constant mintOnePrice = 0.02 ether;
  uint256 public constant mintPackPrice = 0.05 ether;
  uint8 public constant maxEpochs = 10;
  uint8 internal constant scale = 40;
  uint8 internal constant N = 8;
  string s_scale = Strings.toString(scale - 4);
  
  // Precomputed string constants for tokenURI and SVG generation
  string private constant SVG_HEADER = '<svg width="360" height="360" xmlns="http://www.w3.org/2000/svg">';
  string private constant SVG_FOOTER = '</svg>';
  string private constant JSON_PREFIX = '{"name":"';
  string private constant JSON_DESC_PREFIX = '", "description":"';
  string private constant JSON_OWNER_PREFIX = '", "owner":"';
  string private constant JSON_IMAGE_PREFIX = '", "image": "data:image/svg+xml;base64,';
  string private constant JSON_SUFFIX = '"}';
  string private constant TOKEN_URI_PREFIX = 'data:application/json;base64,';
  
  // Constants for metadata strings
  string private constant NAME_PREFIX = 'g4m3 0f l1f3 #';
  string private constant DESC_PREFIX = 'g4m3 0f l1f3 iteration #';
  string private constant GEN_PREFIX = '. Generation #';
  string private constant EPOCH_PREFIX = ' in epoch #';

  // external free minting
  mapping(address => bool) private whitelist;
  address[] private nftCollections = [
    // // polygon mumbai
    // 0x31027EF38d3b58f8186B0C33d8D7f298203E0570
    // eth main net
    0x4E1f41613c9084FdB9E34E11fAE9412427480e56, // terraforms
    0x18Adc812fE66B9381700C2217f0c9DC816c879E6 // chaos roads
  ];

  // track number of free mints
  uint8 private constant OWNER_ALLOCATION = 100;
  uint8 private ownerMints;

  uint8 private constant MAX_FREE_MINTS = 10;
  mapping(address => uint8) freemints;
  // variables
  // uint256 private minted4free = 0;
  // uint256 private createTime;

  // Game state
  uint16 internal _tokenIds = 0;
  uint8 internal _currentEpoch = 0;
  uint16 internal _currentGeneration = 0;
  mapping(uint256 => uint256) internal tokenState;
  uint64 internal gameStateInt;
  mapping(uint8 => mapping(uint64 => bool)) internal occurredGameStates;

  // Functions: Whitelist user & collections
  function addUserToWhitelist(address user) public onlyOwner {
    whitelist[user] = true;
  }

  function removeUserFromWhitelist(address user) public onlyOwner {
    whitelist[user] = false;
  }

  // Functions: Mint
  function mintItem(address mintTo) public payable publicMintLive {
    require(msg.value >= mintOnePrice, 'funds');
    _mintBase(mintTo);
  }

  function mintPack(address mintTo) public payable publicMintLive {
    require(msg.value == mintPackPrice, 'exact amount required');

    for (uint256 i = 0; i < 5; i++) {
      _mintBase(mintTo);
    }
  }

  function mintFreeGated(uint8 noTokens) public {
    require(isEligibleForFreeMint(msg.sender), 'Not eligible for free mint');
    require(freemints[msg.sender] + noTokens <= MAX_FREE_MINTS, 'Not eligible for free mint');
    for (uint8 i = 0; i < noTokens; i++) {
      _mintBase(msg.sender);
      freemints[msg.sender] += 1;
    }
  }

  function mintFreeOwner(uint8 noTokens) public onlyOwner {
    require(noTokens + ownerMints <= OWNER_ALLOCATION, 'fully allocated');
    for (uint i = 0; i < noTokens; i++) {
      _mintBase(msg.sender);
      ownerMints += 1;
    }
  }

  function isEligibleForFreeMint(address user) public view returns (bool) {
    if (whitelist[user]) return true;

    for (uint256 i = 0; i < nftCollections.length; i++) {
      IERC721 nftCollection = IERC721(nftCollections[i]);
      if (nftCollection.balanceOf(user) > 0) return true;
    }

    return false;
  }

  function freeMintsRemaining(address user) public view returns (uint256) {
    if (isEligibleForFreeMint(user)) {
      return MAX_FREE_MINTS - freemints[user];
    } else {
      return 0;
    }
  }

  // internal mint function called by all of the above
  function _mintBase(address to) private {
    // this assumes criteria like eligibility of minting & funding have been checked before!
    _tokenIds += 1;
    _iterateState();

    tokenState[_tokenIds] = BitOps.packState(gameStateInt, _currentEpoch, _currentGeneration);

    _mint(to, _tokenIds);
  }

  // g4m3 0f l1f3 state functions
  function _initState() internal {
    require(_currentEpoch < maxEpochs, 'minted out');
    // set epoch & generation
    _currentEpoch += 1;
    _currentGeneration = 0;

    // Generate a single seed value based on current conditions
    bytes32 seedBytes = _currentEpoch == 1 
        ? keccak256(abi.encodePacked(address(this), _currentEpoch, blockhash(block.number - 1), block.timestamp))
        : keccak256(abi.encodePacked(address(this), _currentEpoch, gameStateInt));
        
    // Use the full 256 bits of entropy from the hash
    uint256 fullSeed = uint256(seedBytes);
    
    // Generate the initial state more efficiently
    uint64 gridInt = 0;
    
    // Use different parts of the seed to set bits
    // We only need 64 bits of randomness total
    unchecked {
      for (uint8 i = 0; i < 64; i++) {
        // Extract randomness from different parts of the seed 
        // based on position to avoid patterns
        uint8 byteOffset = i / 8;
        uint8 bitSelector = i % 8;
        
        // Get a random byte from the seed - use modulo to wrap around
        // and get different parts of the seed
        uint8 randomByte = uint8(fullSeed >> (((i * 17) + (byteOffset * 13)) % 256));
        
        // Use bit 'bitSelector' from randomByte to determine if this cell is alive
        bool isAlive = ((randomByte >> bitSelector) & 1) != 0;
        
        // For increased randomness, apply an additional threshold
        // Use a different part of the seed for this check
        uint8 threshold = uint8(fullSeed >> (((i * 23) + 119) % 256));
        
        // Approximately 50% chance of being alive (threshold > 127)
        if (isAlive && threshold > 127) {
          gridInt |= uint64(1) << i;
        }
      }
    }
    
    gameStateInt = gridInt;
  }

  function _iterateState() internal {
    if (_currentGeneration >= 511) {
      _initState();
    } else {
      // Use bitwise operations directly without grid conversion
      uint64 newGameStateInt = _determineNextGenerationBitwise(gameStateInt);
      
      // The rest of the code uses the uint64 value directly
      if (occurredGameStates[_currentEpoch][newGameStateInt]) {
        _initState();
      } else {
        _currentGeneration += 1;
        gameStateInt = newGameStateInt;
        occurredGameStates[_currentEpoch][newGameStateInt] = true;
      }
    }
  }

  // Optimized version that operates directly on bits without grid conversion
  function _determineNextGenerationBitwise(uint64 currentState) internal pure returns (uint64) {
    uint64 newState = 0;
    
    // Pre-calculate shifted rows for neighbor checks with wraparound
    uint64 topRow = ((currentState & 0x00000000000000FF) << 56) | (currentState >> 8);
    uint64 middleRow = currentState;
    uint64 bottomRow = ((currentState & 0xFF00000000000000) >> 56) | (currentState << 8);
    
    // Process cells row by row
    for (uint8 row = 0; row < 8; row++) {
      uint64 rowShift = row * 8;
      
      // Extract row bits with wraparound already applied
      uint8 topRowBits = uint8((topRow >> rowShift) & 0xFF);
      uint8 midRowBits = uint8((middleRow >> rowShift) & 0xFF);
      uint8 botRowBits = uint8((bottomRow >> rowShift) & 0xFF);
      
      for (uint8 col = 0; col < 8; col++) {
        uint8 cellPos = row * 8 + col;
        bool isAlive = ((currentState >> cellPos) & 1) == 1;
        
        // Get neighbor columns with wraparound
        uint8 leftCol = (col == 0) ? 7 : col - 1;
        uint8 rightCol = (col == 7) ? 0 : col + 1;
        
        // Count all 8 neighbors with bitwise operations
        uint8 neighbors = 0;
        neighbors += (topRowBits >> leftCol) & 1;  // Top-left
        neighbors += (topRowBits >> col) & 1;      // Top
        neighbors += (topRowBits >> rightCol) & 1; // Top-right
        neighbors += (midRowBits >> leftCol) & 1;  // Left
        neighbors += (midRowBits >> rightCol) & 1; // Right
        neighbors += (botRowBits >> leftCol) & 1;  // Bottom-left
        neighbors += (botRowBits >> col) & 1;      // Bottom
        neighbors += (botRowBits >> rightCol) & 1; // Bottom-right
        
        // Apply Game of Life rules
        bool newCellState = isAlive ? 
            (neighbors == 2 || neighbors == 3) : // Survival
            (neighbors == 3);                    // Birth
        
        // Set the bit if alive
        if (newCellState) {
            newState |= (uint64(1) << cellPos);
        }
      }
    }
    
    return newState;
  }

  // Original function kept for compatibility with other code that may use it
  function _determineNextGeneration()
    internal
    view
    returns (bool[N][N] memory newGameStateFromInt)
  {
    bool[N][N] memory oldGameStateFromInt = BitOps.wordToGrid(gameStateInt);
    newGameStateFromInt = oldGameStateFromInt;

    for (uint256 i = 0; i < N; i += 1) {
      for (uint256 j = 0; j < N; j += 1) {
        uint256 total = _calculateTotalNeighbors(oldGameStateFromInt, i, j);
        newGameStateFromInt[i][j] = _determineCellState(oldGameStateFromInt[i][j], total);
      }
    }
    return newGameStateFromInt;
  }

  // // Using unsafe math (underflow possible)
  // function _calculateTotalNeighbors(
  //   bool[N][N] memory gameState,
  //   uint256 i,
  //   uint256 j
  // ) internal pure returns (uint256) {
  //   return
  //     uint256(
  //       BitOps._b2u(gameState[uint256((i - 1) % N)][uint256((j - 1) % N)]) +
  //         BitOps._b2u(gameState[uint256((i - 1) % N)][j]) +
  //         BitOps._b2u(gameState[uint256((i - 1) % N)][uint256((j + 1) % N)]) +
  //         BitOps._b2u(gameState[i][uint256((j + 1) % N)]) +
  //         BitOps._b2u(gameState[uint256((i + 1) % N)][uint256((j + 1) % N)]) +
  //         BitOps._b2u(gameState[uint256((i + 1) % N)][j]) +
  //         BitOps._b2u(gameState[uint256((i + 1) % N)][uint256((j - 1) % N)]) +
  //         BitOps._b2u(gameState[i][uint256((j - 1) % N)])
  //     );
  // }

  function _calculateTotalNeighbors(
    bool[N][N] memory gameState,
    uint256 i,
    uint256 j
  ) internal pure returns (uint256) {
    uint256 iMinusOne = (i == 0) ? N - 1 : i - 1;
    uint256 jMinusOne = (j == 0) ? N - 1 : j - 1;
    uint256 iPlusOne = (i + 1) % N;
    uint256 jPlusOne = (j + 1) % N;

    return
      uint256(
        BitOps._b2u(gameState[iMinusOne][jMinusOne]) +
          BitOps._b2u(gameState[iMinusOne][j]) +
          BitOps._b2u(gameState[iMinusOne][jPlusOne]) +
          BitOps._b2u(gameState[i][jPlusOne]) +
          BitOps._b2u(gameState[iPlusOne][jPlusOne]) +
          BitOps._b2u(gameState[iPlusOne][j]) +
          BitOps._b2u(gameState[iPlusOne][jMinusOne]) +
          BitOps._b2u(gameState[i][jMinusOne])
      );
  }

  function _determineCellState(
    bool currentCellState,
    uint256 totalNeighbors
  ) internal pure returns (bool) {
    if (currentCellState) {
      return !(totalNeighbors < 2 || totalNeighbors > 3);
    } else {
      return totalNeighbors == 3;
    }
  }

  // Original function kept for compatibility
  function _checkForEpochEnd(bool[N][N] memory newGameStateFromInt) internal {
    uint64 gameStateIntNew = BitOps.gridToWord(newGameStateFromInt);

    if (occurredGameStates[_currentEpoch][gameStateIntNew]) {
      _initState();
    } else {
      _currentGeneration += 1;
      gameStateInt = gameStateIntNew;
      occurredGameStates[_currentEpoch][gameStateIntNew] = true;
    }
  }

  // Token Rendering

  function tokenURI(uint256 id) public view override returns (string memory) {
    require(_exists(id), 'nt');
    
    // Unpack state once and reuse for all functions
    uint64 gameState;
    uint8 epoch;
    uint16 generation;
    (gameState, epoch, generation) = BitOps.unpackState(tokenState[id]);
    
    // Pass cached state values to all functions
    string memory image = Base64.encode(bytes(generateSVGofTokenById(id, gameState)));
    Structs.MetaData memory metadata = generateMetadata(id, gameState, epoch, generation);

    return
      string(
        abi.encodePacked(
          TOKEN_URI_PREFIX,
          Base64.encode(
            bytes(
              abi.encodePacked(
                JSON_PREFIX,
                metadata.name,
                JSON_DESC_PREFIX,
                metadata.description,
                '",',
                G0l.generateAttributeString(
                  metadata.times,
                  metadata.epoch,
                  metadata.generation,
                  metadata.populationDensity,
                  metadata.birthCount,
                  metadata.deathCount,
                  metadata.shape,
                  metadata.speed,
                  metadata.pattern,
                  metadata.trend
                ),
                // Now the attributes string doesn't have a trailing comma
                ',"owner":"',
                (uint160(ownerOf(id))).toHexString(20),
                JSON_IMAGE_PREFIX,
                image,
                JSON_SUFFIX
              )
            )
          )
        )
      );
  }

  function generateSVGofTokenById(uint256 id, uint64 gameState) internal view returns (string memory) {
    // Use precomputed constants for SVG elements
    return string(
      abi.encodePacked(
        SVG_HEADER,
        renderGameGrid(id, gameState),
        SVG_FOOTER
      )
    );
  }
  
  // Keep the original function for backward compatibility
  function generateSVGofTokenById(uint256 id) internal view returns (string memory) {
    uint64 gameState;
    (gameState, , ) = BitOps.unpackState(tokenState[id]);
    return generateSVGofTokenById(id, gameState);
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

  // Original function for backward compatibility
  function renderGameGrid(uint256 id) private view returns (string memory) {
    uint64 gameState;
    (gameState, , ) = BitOps.unpackState(tokenState[id]);
    return renderGameGrid(id, gameState);
  }
  
  function renderGameGrid(uint256 id, uint64 gameState) private view returns (string memory) {
    // render that thing using the passed gameState instead of unpacking again
    bool[N][N] memory grid = BitOps.wordToGrid(gameState);
    string[] memory squares = new string[](N * N);
    uint256 slotCounter = 0;
    uint64 stateDiff;
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

    // Using unchecked block for the grid loops since we know the exact size (8x8)
    // This saves gas by skipping overflow checks that are unnecessary in this context
    unchecked {
      for (uint8 i = 0; i < grid.length; i++) {
        bool[8] memory row = grid[i];
        for (uint8 j = 0; j < row.length; j++) {
          CellData.i = i;
          CellData.j = j;
          CellData.alive = grid[i][j];
          string memory square;

        // check for stateDiff
        CellData.hasChanged = BitOps.getBooleanFromIndex64(stateDiff, (i * 8 + j));

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
    } // Close unchecked block
    }

    // combine array of squares into single bytes array

    bytes memory output;
    // add general svg, e.g. background
    output = G0l.renderDefs(
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
      '<rect width="360" height="360" fill="',
      colorMap.backgroundColor,
      '" />'
    );
    // Use unchecked for the loop through fixed-size array
    unchecked {
      for (uint256 i = 0; i < squares.length; i++) {
        output = abi.encodePacked(output, squares[i]);
      }
    }

    return string(output);
  }

  // Original function for backward compatibility
  function generateMetadata(uint256 id) internal view returns (Structs.MetaData memory) {
    uint64 gameState;
    uint8 epoch;
    uint16 generation;
    (gameState, epoch, generation) = BitOps.unpackState(tokenState[id]);
    return generateMetadata(id, gameState, epoch, generation);
  }
  
  function generateMetadata(uint256 id, uint64 gameState, uint8 epoch, uint16 generation) internal view returns (Structs.MetaData memory) {
    Structs.MetaData memory metadata;
    
    // Cache string conversions to avoid repeated conversions
    string memory epochStr = Strings.toString(epoch);
    string memory idStr = id.toString();
    string memory generationStr = uint256(generation).toString();
    
    metadata.epoch = epochStr;
    metadata.generation = generation;
    metadata.populationDensity = BitOps.getCountOfOnBits(gameState);
    
    // Use constants and cached strings
    metadata.name = string(
      abi.encodePacked(
        NAME_PREFIX,
        idStr,
        ' ',
        epochStr,
        '/',
        generationStr
      )
    );
    
    metadata.description = string(
      abi.encodePacked(
        DESC_PREFIX,
        idStr,
        GEN_PREFIX,
        generationStr,
        EPOCH_PREFIX,
        epochStr
      )
    );

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
        metadata.trend = string(abi.encodePacked('+', Strings.toString(metadata.popDiff)));
      } else if (populationTrends.up == 0) {
        metadata.trend = string(abi.encodePacked('-', Strings.toString(metadata.popDiff)));
      } else {
        metadata.trend = Strings.toString(metadata.popDiff);
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

    // // override for testing:
    // metadata.shape = 4;
    // metadata.pattern = 1;
    // metadata.speed = 3;

    return metadata;
  }

  function returnGameState(uint256 id) public view returns (bool[8][8] memory) {
    require(_exists(id), 'Token ID does not exist');
    uint64 gameStateWord;
    (gameStateWord, , ) = BitOps.unpackState(tokenState[id]);
    return BitOps.wordToGrid(gameStateWord);
  }

  // Withdraw
  function drainFunds() public onlyOwner {
    uint256 balance = address(this).balance;
    payable(owner()).transfer(balance);
    emit Withdrawal(msg.sender, balance);
  }

  receive() external payable {}
}
