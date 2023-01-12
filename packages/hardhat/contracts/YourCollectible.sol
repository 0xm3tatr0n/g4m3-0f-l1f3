pragma solidity >=0.7.0 <0.8.0;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import 'base64-sol/base64.sol';

import './HexStrings.sol';
import './G4m3.sol';
// import './ToColor.sol';
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721 16631332

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

import {G0l, BitOps} from './Libraries.sol';
import {Structs} from './StructsLibrary.sol';

contract YourCollectible is ERC721, Pausable, Ownable, G4m3 {

  using Strings for uint256;
  using HexStrings for uint160;
  // using ToColor for bytes3;

  constructor() ERC721("gam3 0f l1f3", "g0l") {
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
  uint256 constant public maxItems = 10;
  uint256 constant public mintPrice = 0.01 ether;


  // variables
  uint256 private minted4free = 0;
  uint256 private createTime;






  function mintItem(address mintTo)
      public
      payable
      whenNotPaused
      returns (uint256)
  {
      require( msg.value >= mintPrice, "No such thing as a free mint!");
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(mintTo, id);
      _iterateState();

      // store token states
      tokenGridStatesInt[id] = gameStateInt;
      tokenGeneration[id] = _currentGeneration.current();

      return id;
  }

  function mintMany(address mintTo, uint256 noItems) 
    public 
    payable 
    whenNotPaused 
  {
    require(noItems <= maxItems, "too many mints requested");
    require(msg.value >= mintPrice * noItems, "not enough funds sent");

    for (uint i = 0; i < noItems; i++){
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(mintTo, id);
      _iterateState();

      // store token states
      tokenGridStatesInt[id] = gameStateInt;
      tokenGeneration[id] = _currentGeneration.current();
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

    if (bornCells > perishedCells){
      trends.up = 1;
      trends.popDiff = bornCells - perishedCells;
    } else if (bornCells < perishedCells){
      trends.up = 0;
      trends.popDiff = uint256(-int(bornCells - perishedCells));
    } else {
      trends.up = 99;
      trends.popDiff = 0;
    }

    return trends;
  }

  function generateMetadata(uint256 id) private view returns (Structs.MetaData memory){
      
      Structs.MetaData memory metadata;
      metadata.populationDensity = BitOps.getCountOfOnBits(tokenGridStatesInt[id]);
      metadata.name = string(abi.encodePacked('gam3 0f l1f3 #',id.toString()));
      metadata.description = string(abi.encodePacked('gam3 0f l1f3 #', id.toString()));
      metadata.generation = Strings.toString(tokenGeneration[id]);

      // "arbitrary" value to mix things up (not random because deterministic)
      uint256 arbitrary = uint256(keccak256(abi.encodePacked(metadata.generation, metadata.description)));
      metadata.seed = arbitrary;
      uint256 arbitrarySelector = arbitrary % 13;

      if (arbitrarySelector < 1){
        metadata.representation = 0;
      } else if (arbitrarySelector < 3){
        metadata.representation = 1;
      } else {
        metadata.representation = 2;
      }
      // get data for births & deaths
      uint256 stateDiff;
      if (id > 1){
        stateDiff = tokenGridStatesInt[id - 1] ^ tokenGridStatesInt[id];

        uint256 bornCells = BitOps.getCountOfOnBits(tokenGridStatesInt[id] & stateDiff);
        uint256 perishedCells = BitOps.getCountOfOnBits(~tokenGridStatesInt[id] & stateDiff);
        // set counts
        metadata.birthCount = bornCells;
        metadata.deathCount = perishedCells;

        Structs.Trends memory populationTrends = getTrends(bornCells, perishedCells);

        // determine prosperity levels
        metadata.popDiff = populationTrends.popDiff;

        if (populationTrends.up == 1){
          metadata.trend = 'up';
          if (populationTrends.popDiff > 2){
            metadata.times = 1;
          } else {
            metadata.times = 0;
          }
        } else if (populationTrends.up == 0){
          metadata.trend = 'down';
          if (populationTrends.popDiff > 2){
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

  function generateAttributeString(Structs.MetaData memory metadata) internal pure returns (string memory){
    
    string memory timesName;
    if (metadata.times == 0){
      timesName = 'stable';
    }
    else if (metadata.times == 1) {
      timesName = 'good';
    } else if (metadata.times == 2){
      timesName = 'bad';
    } else if (metadata.times == 3){
      timesName = 'zero';
    }

    string memory representationName;

    if (metadata.representation == 0){
      representationName = 'raw';
    } else if (metadata.representation == 1){
      representationName = 'static';
    } else if (metadata.representation == 2){
      representationName = 'animated';
    }
    
    string memory attributeString = string(abi.encodePacked('", "attributes": [{"trait_type": "generation", "value": "#',
        metadata.generation,
        '"},',
        '{"trait_type" : "density", "value": "', Strings.toString(metadata.populationDensity), '"},' ,
        '{"trait_type" : "births", "value": "', Strings.toString(metadata.birthCount), '"},' ,
        '{"trait_type" : "deaths", "value": "', Strings.toString(metadata.deathCount), '"},' ,
        '{"trait_type" : "trend", "value": "', metadata.trend, '"},' ,
        '{"trait_type" : "population_difference", "value": "', Strings.toString(metadata.popDiff), '"},' ,
        '{"trait_type" : "times", "value": "', timesName, '"},' ,
        '{"trait_type" : "representation", "value": "', representationName, '"}' ,
        '],'));
    return attributeString;
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
      require(_exists(id), "token does not exist");
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
                              '", "external_url":"https://burnyboys.com/token/',
                              id.toString(),
                              generateAttributeString(metadata),
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
    string memory svg = string(abi.encodePacked(
      '<svg width="320" height="320" xmlns="http://www.w3.org/2000/svg" onload="init()">',
        renderGameGrid(id),
      '</svg>'
    ));

    return svg;
  }

  function generateColorMap(Structs.MetaData memory metadata) private view returns (Structs.ColorMap memory){
    
    Structs.ColorMap memory colorMap;

    uint256 selectedColorScheme = metadata.populationDensity < 25 ? metadata.times : metadata.times + 4;

    // modify selected palette
    if (metadata.seed % 42 < 13){
      selectedColorScheme = selectedColorScheme + 4;
    }

    colorMap.backgroundColor = G0l.returnColor(selectedColorScheme, 0);
    colorMap.aliveColor = G0l.returnColor(selectedColorScheme, 1);
    colorMap.deadColor = G0l.returnColor(selectedColorScheme, 2);

    // handle birth's intensity
    if (metadata.birthCount < 6){
      colorMap.bornColor = G0l.returnColor(selectedColorScheme, 3);
    } else{
      colorMap.bornColor = G0l.returnColor(selectedColorScheme, 4);
    } 

    // handle death intensity
    if (metadata.deathCount < 6){
      colorMap.perishedColor = G0l.returnColor(selectedColorScheme, 5);
    } else {
      colorMap.perishedColor = G0l.returnColor(selectedColorScheme, 6);
    } 
    

    return colorMap;
  }


  function renderGameSquare(
      bool alive, 
      bool hasChanged, 
      uint256 i,
      uint256 j,
      Structs.ColorMap memory colorMap,
      uint256 representation
    ) internal view returns (string memory)
  {
    //
    string memory square;
    string memory i_scale = Strings.toString(i * scale + 2);
    string memory j_scale = Strings.toString(j * scale + 2);

    if (alive && !hasChanged){
          // was alive last round
          square = string(abi.encodePacked(
            '<g>',
              '<rect width="',s_scale,'" height="',s_scale,'" ', 
                'x="', 
                i_scale, 
                '" y="',
                j_scale,
                '" fill="',colorMap.aliveColor,'"', 
              '/>'
            '</g>'));
        } else if (alive && hasChanged){
          // case: new born
          square = string(abi.encodePacked(
            '<g transform="translate(', i_scale , ',' , j_scale , ')">',
              '<rect width="',s_scale,'" height="',s_scale,'" ', 
                ' fill="',colorMap.bornColor,'"', 
              '/>',
              // '<text x="',
              // i_scale_offset, 
              // '" y="',
              // j_scale_offset,
              // '" font-family="Courier" font-size="14" fill="',colorMap.deadColor,'" dominant-baseline="middle" text-anchor="middle" font-weight="bold">O</text>',
              // G0l.renderBabySVG("0", "0", "36", 'foo'),
              // '<polygon points="0,0 36,36 36,0" fill="green" />',
            '</g>'));
        } else if (!alive && !hasChanged){
          // case: didn't exist in previous round
            square = string(abi.encodePacked(
              '<g>',
                '<rect width="',s_scale,'" height="',s_scale,'" ', 
                  'x="', 
                  i_scale, 
                  '" y="',
                  j_scale,
                  '" fill="',colorMap.deadColor,'"', 
                '/>',
              '</g>'));
          } else if (!alive && hasChanged) {
            // case: died this round
            if (representation == 0){
                square = string(abi.encodePacked(
                  '<g transform="translate(', i_scale , ',' , j_scale , ')">',
                    '<rect width="',s_scale,'" height="',s_scale,'" ', 
                      ' fill="',colorMap.deadColor,'"', 
                    '/>',
                  '</g>'));

            } else if (representation == 1){
                square = string(abi.encodePacked(
                  '<g transform="translate(', i_scale , ',' , j_scale , ')">',
                    '<rect width="',s_scale,'" height="',s_scale,'" ', 
                      ' fill="',colorMap.deadColor,'"', 
                    '/>',
                    '<polygon points="0,36 36,36 0,0" fill="',colorMap.perishedColor,'">',
                    '</polygon>',
                  '</g>'));

            } else if (representation == 2){
                square = string(abi.encodePacked(
                  '<g transform="translate(', i_scale , ',' , j_scale , ')">',
                    '<rect width="',s_scale,'" height="',s_scale,'" ', 
                      ' fill="',colorMap.deadColor,'"', 
                    '/>',
                    // '<text x="',
                    // i_scale_offset, 
                    // '" y="',
                    // j_scale_offset,
                    // '" font-family="Courier" font-size="14" fill="',colorMap.deadColor,'" dominant-baseline="middle" text-anchor="middle" font-weight="bold">O</text>',
                    // G0l.renderZombieSVG(colorMap),
                    '<polygon points="0,36 36,36 0,0" fill="',colorMap.perishedColor,'">',
                    G0l.returnPerishedAnimation(colorMap, i, j, representation), 
                    '</polygon>',
                  '</g>'));

            }

        }

        return square;
  }

  // Visibility is `public` to enable it being called by other contracts for composition.

  function renderGameGrid(uint256 id) public view returns (string memory){
    // render that thing
    bool[dim][dim] memory grid = wordToGrid(tokenGridStatesInt[id]);
    string[] memory squares = new string[](dim * dim);
    uint256 slotCounter = 0;
    uint256 stateDiff;

    // figure out which cells have changed in this round
    if (id > 1){
      // case: not the first item (todo: catch generation changes)
      stateDiff = tokenGridStatesInt[id - 1] ^ tokenGridStatesInt[id];
    } else  {
      // no changes since first born
    }

    // determine color map
    // uint256 density = BitOps.getCountOfOnBits(tokenGridStatesInt[id]);
    Structs.MetaData memory metaData = generateMetadata(id);
    Structs.ColorMap memory colorMap = generateColorMap(metaData);

    for (uint256 i = 0; i < grid.length; i += 1){
      //
      bool[dim] memory row = grid[i];
      for (uint256 j = 0; j < row.length; j += 1){
        bool alive = grid[i][j];
        string memory square;

        // check for stateDiff
        bool hasChanged = BitOps.getBooleanFromIndex(stateDiff, (i * dim + j));
        square = renderGameSquare(alive, hasChanged,i, j, colorMap, metaData.representation);
        
        squares[slotCounter] = square;
        slotCounter += 1;
      }
    }

  // combine array of squares into single bytes array

    bytes memory output;
    // add general svg, e.g. background
    output = abi.encodePacked('<rect width="100%" height="100%" fill="',colorMap.backgroundColor,'" />' );
    for (uint256 i = 0; i < squares.length; i += 1){
      output = abi.encodePacked(output, squares[i]);
    }

    return string(output);

  }

function wordToGrid(uint256 word) pure internal returns ( bool[dim][dim] memory){
  // convert word to bool[][] (prior to iterate state)
  bool[dim][dim] memory grid;
  for (uint256 i = 0; i < dim; i += 1){
    for (uint256 j = 0; j < dim; j += 1){
      //
      grid[i][j] = BitOps.getBooleanFromIndex(word, (i * dim + j));
    }
  }

  return grid;
}

function gridToWord(bool[dim][dim] memory grid) view internal returns(uint256){
  // convert bool[][] to word (after completing iterating state)
  uint256 word;
  for (uint256 i = 0; i < dim; i += 1){
    for (uint256 j = 0; j < dim; j += 1){
      word = BitOps.setBooleaOnIndex(word, (i * dim + j), grid[i][j]);
    }
  }
  return word;
}

function withdrawAmount(uint256 amount) public onlyOwner {
  require(amount <= address(this).balance, "withdraw amnt too high");
  msg.sender.transfer(amount);
  emit Withdrawal(msg.sender, amount);
}

function mintForFree(address mintTo, uint256 noItems) public onlyOwner {
  // owner mint allocation of 1 item / day
  uint256 currentAlloc = (block.timestamp - createTime) / (1 days);
  require((minted4free + noItems) <= currentAlloc, "not enough free mints");

  for (uint i = 0; i < noItems; i++){
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


}
