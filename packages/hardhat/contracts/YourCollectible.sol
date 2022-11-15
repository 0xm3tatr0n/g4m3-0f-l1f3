pragma solidity >=0.7.0 <0.8.0;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import 'base64-sol/base64.sol';

import './HexStrings.sol';
// import './ToColor.sol';
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721 16631332

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract YourCollectible is ERC721, Ownable {

  using Strings for uint256;
  using HexStrings for uint160;
  // using ToColor for bytes3;
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor() ERC721("gam3 0f l1f3", "g0l") {
    _initState();
    // _iterateState();
  }

  // constants
  // string[] colors = ["#190c28", "#fef7ee", "#fb0002", "#fef000", "#1c82eb"];
  uint256 constant private gridDimensions = 8;

  // variables
  mapping(uint256 => bool[gridDimensions][gridDimensions]) tokenGridStates;
  bool[gridDimensions][gridDimensions] public gameState;
  uint256 mintDeadline = block.timestamp + 24 hours;

  // return state convenience
  function showState() public view returns (bool[gridDimensions][gridDimensions] memory){
    return gameState;
  }

  function _initState() internal {
    // temporary storage
    console.log("initializing game state... ");
    bool[gridDimensions][gridDimensions] memory results;

    // generate some randomness
    // seed
    bytes32 seedBytes = keccak256(abi.encodePacked("foo", "bar", blockhash(block.number - 1), block.timestamp));

    // loop over bytes
    require(seedBytes.length % gridDimensions == 0, 'not enough bytes');

    uint256 r = uint256(seedBytes);
    // uint256[] memory b;

    for (uint256 i = 0; i < gridDimensions; i += 1){
      uint8 m = uint8( r >> i * 8);

      for (uint256 j = 0; j < gridDimensions; j += 1){
        uint256 s = uint256(keccak256(abi.encodePacked(Strings.toString(m), address(this))));
        // console.log('row seed: ', s);
        uint8 n = uint8( s >> j * 8);
        bool result;
        if (n > 125){
          result = true;
        } else {
          result = false;
        }

        results[i][j] = result;
      }
    }

    gameState = results;
    console.log('game state initialized!', gameState.length);

  }

  function _b2u(bool input) private pure returns(uint){
    return input ? 1 : 0;
  }

  function _shiftIndex(int index) private pure returns(uint256) { 
    //
    if (index < 0){
      return gridDimensions - 1;
    } else {
      return uint(index);
    }
  }

  function _iterateState() private {
    // play game of life
    bool[gridDimensions][gridDimensions] memory newGameState = gameState;
    uint256 N = gridDimensions;

    for (uint256 i = 0; i < gridDimensions; i += 1){
      for (uint256 j = 0; j < gridDimensions; j += 1){
        // console.log('updating: ', i, j);
        uint256 total = uint( 
          _b2u(gameState[i][_shiftIndex(int(j-1)) % N]) + _b2u(gameState[i][(j+1) % N ]) + 
          _b2u(gameState[_shiftIndex(int(i - 1)) % N][j]) + _b2u(gameState[(i + 1) % N][j]) +
          _b2u(gameState[_shiftIndex(int(i - 1)) % N][(j-1) % N]) + _b2u(gameState[_shiftIndex(int(i - 1)) % N][(j + 1) % N]) +
          _b2u(gameState[(i + 1) % N][_shiftIndex(int(j - 1)) % N]) + _b2u(gameState[(i + 1) % N][(j + 1) % N])
                              
        );

        // console.log('total: ', total);
        if (gameState[i][j] == true){
          if (total < 2 || total > 3){
              newGameState[i][j] = false;

          }
        } else {
          if (total ==3){
            newGameState[i][j] = true;
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

    gameState = newGameState;
  }


  function mintItem(address mintTo)
      public
      payable
      returns (uint256)
  {
      require( block.timestamp < mintDeadline, "DONE MINTING");
      require( msg.value >= 0.001 ether, "No such thing as a free mint!");
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(mintTo, id);
      _iterateState();
      tokenGridStates[id] = gameState;

      return id;
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
      require(_exists(id), "token does not exist");
      string memory name = string(abi.encodePacked('gam3 0f l1f3 #',id.toString()));
      string memory description = string(abi.encodePacked('gam3 0f l1f3 #', id.toString()));
      string memory image = Base64.encode(bytes(generateSVGofTokenById(id)));

      return
          string(
              abi.encodePacked(
                'data:application/json;base64,',
                Base64.encode(
                    bytes(
                          abi.encodePacked(
                              '{"name":"',
                              name,
                              '", "description":"',
                              description,
                              '", "external_url":"https://burnyboys.com/token/',
                              id.toString(),
                              '", "attributes": [{"trait_type": "color", "value": "#',
                              'bar',
                              '"}], "owner":"',
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
    string memory svg = string(abi.encodePacked(
      '<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg" onload="init()">',
        // renderGameGrid(tokenGridStates[id]),
        renderGameGrid(tokenGridStates[id]),
      '</svg>'
    ));

    return svg;
  }

  // Visibility is `public` to enable it being called by other contracts for composition.

  function renderGameGrid(bool[gridDimensions][gridDimensions] memory grid) public pure returns (string memory){
    // render that thing
    string[] memory squares = new string[](gridDimensions * gridDimensions);
    uint256 slotCounter = 0;

    for (uint256 i = 0; i < grid.length; i += 1){
      //
      bool[gridDimensions] memory row = grid[i];
      for (uint256 j = 0; j < row.length; j += 1){
        bool alive = grid[i][j];
        string memory square;
        if (alive){
          square = string(abi.encodePacked(
            '<rect width="10" height="10" ', 
            'x="', 
            Strings.toString(i * 10), 
            '" y="',
            Strings.toString(j * 10),
            '" fill="black"', 
            '/>'));
        } else {
          square = string(abi.encodePacked(
            '<rect width="10" height="10" ', 
            'x="', 
            Strings.toString(i * 10), 
            '" y="',
            Strings.toString(j * 10),
            '" fill="white"', 
            '/>'));
        }

        squares[slotCounter] = square;
        slotCounter += 1;
      }
    }

  // combine array of squares into single bytes array

  bytes memory output;
  for (uint256 i = 0; i < squares.length; i += 1){
    output = abi.encodePacked(output, squares[i]);
  }

  return string(output);

  }

  // function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
  //     if (_i == 0) {
  //         return "0";
  //     }
  //     uint j = _i;
  //     uint len;
  //     while (j != 0) {
  //         len++;
  //         j /= 10;
  //     }
  //     bytes memory bstr = new bytes(len);
  //     uint k = len;
  //     while (_i != 0) {
  //         k = k-1;
  //         uint8 temp = (48 + uint8(_i - _i / 10 * 10));
  //         bytes1 b1 = bytes1(temp);
  //         bstr[k] = b1;
  //         _i /= 10;
  //     }
  //     return string(bstr);
  // }


}
