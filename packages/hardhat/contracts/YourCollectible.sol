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
  
  uint256 constant private dim = 10;

  // variables
  // new implementation
  mapping(uint256 => uint256) tokenGridStatesInt;
  uint256 private gameStateInt;

  // return state convenience
  function showStateInt() public view returns (uint256){
    return gameStateInt;
  }

  function _initState() internal {
    // temporary storage
    bool[dim][dim] memory results;

    // generate some "randomness"
    bytes32 seedBytes = keccak256(abi.encodePacked(address(this) ,"foo", "bar", blockhash(block.number - 1), block.timestamp));

    uint256 r = uint256(seedBytes);
    // uint256[] memory b;
    uint256 gridInt = r;
    for (uint256 i = 0; i < dim; i += 1){
      uint8 m = uint8( r >> i * 8);

      for (uint256 j = 0; j < dim; j += 1){
        // generate row seed
        uint256 s = uint256(keccak256(abi.encodePacked(Strings.toString(m), address(this))));

        uint8 n = uint8( s >> j * 8);
        bool result;
        if (n > 125){
          result = true;
        } else {
          result = false;
        }

        results[i][j] = result;
        gridInt = setBooleaOnIndex(gridInt, (i * dim) + j, result);
      }
    }

    gameStateInt = gridInt;

  }

  function _b2u(bool input) private pure returns(uint){
    return input ? 1 : 0;
  }

  // function _shiftIndex(int index) private pure returns(uint256) { 
  //   //
  //   if (index < 0){
  //     return dim - 1;
  //   } else {
  //     return uint(index);
  //   }
  // }

  function _iterateState() private {
    // play game of life
    uint256 N = dim;

    bool[dim][dim] memory oldGameStateFromInt = wordToGrid(gameStateInt);
    bool[dim][dim] memory newGameStateFromInt = oldGameStateFromInt;

    for (uint256 i = 0; i < dim; i += 1){
      for (uint256 j = 0; j < dim; j += 1){

        // uint256 total = uint( 
        //   _b2u(oldGameStateFromInt[i][_shiftIndex(int(j-1)) % N]) + _b2u(oldGameStateFromInt[i][(j+1) % N ]) + 
        //   _b2u(oldGameStateFromInt[_shiftIndex(int(i - 1)) % N][j]) + _b2u(oldGameStateFromInt[(i + 1) % N][j]) +
        //   _b2u(oldGameStateFromInt[_shiftIndex(int(i - 1)) % N][(j-1) % N]) + _b2u(oldGameStateFromInt[_shiftIndex(int(i - 1)) % N][(j + 1) % N]) +
        //   _b2u(oldGameStateFromInt[(i + 1) % N][_shiftIndex(int(j - 1)) % N]) + _b2u(oldGameStateFromInt[(i + 1) % N][(j + 1) % N])
                              
        // );


        uint256 total = uint(
          _b2u(oldGameStateFromInt[uint((i - 1) % N)][uint((j-1) % N)]) +
          _b2u(oldGameStateFromInt[uint((i - 1) % N)][j]) +
          _b2u(oldGameStateFromInt[uint((i - 1) % N)][uint((j+1) % N)]) +
          _b2u(oldGameStateFromInt[i][uint((j+1) % N)]) +
          _b2u(oldGameStateFromInt[uint((i + 1) % N)][uint((j+1) % N)]) +
          _b2u(oldGameStateFromInt[uint((i + 1) % N)][j]) +
          _b2u(oldGameStateFromInt[uint((i + 1) % N)][uint((j-1) % N)]) +
          _b2u(oldGameStateFromInt[i][uint((j-1) % N)])
        );

        if (oldGameStateFromInt[i][j] == true){
          if (total < 2 || total > 3){
              // todo: change this!
              newGameStateFromInt[i][j] = false;

          }
        } else {
          if (total ==3){
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

    // convert newGameStateFromInt back to int, update state
    gameStateInt = gridToWord(newGameStateFromInt);
  }


  function mintItem(address mintTo)
      public
      payable
      returns (uint256)
  {
      require( msg.value >= 0.001 ether, "No such thing as a free mint!");
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(mintTo, id);
      _iterateState();

      // new implementation
      tokenGridStatesInt[id] = gameStateInt;

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
    // get token gameState as int, convert to grid
    bool[dim][dim] memory grid = wordToGrid(tokenGridStatesInt[id]);

    string memory svg = string(abi.encodePacked(
      '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg" onload="init()">',
        // renderGameGrid(tokenGridStates[id]),
        renderGameGrid(grid),
      '</svg>'
    ));

    return svg;
  }

  // Visibility is `public` to enable it being called by other contracts for composition.

  function renderGameGrid(bool[dim][dim] memory grid) public pure returns (string memory){
    // render that thing
    string[] memory squares = new string[](dim * dim);
    uint256 scale = 25;
    uint256 slotCounter = 0;

    for (uint256 i = 0; i < grid.length; i += 1){
      //
      bool[dim] memory row = grid[i];
      for (uint256 j = 0; j < row.length; j += 1){
        bool alive = grid[i][j];
        string memory square;
        if (alive){
          square = string(abi.encodePacked(
            '<rect width="',Strings.toString(scale - 4),'" height="',Strings.toString(scale - 4),'" ', 
            'x="', 
            Strings.toString(i * scale), 
            '" y="',
            Strings.toString(j * scale),
            '" fill="black"', 
            '/>'));
        } else {
          square = string(abi.encodePacked(
            '<rect width="',Strings.toString(scale),'" height="',Strings.toString(scale),'" ', 
            'x="', 
            Strings.toString(i * scale), 
            '" y="',
            Strings.toString(j * scale),
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

function getBooleanFromIndex(uint256 _packedBools, uint256 _boolNumber)  
    private pure returns(bool)  
{  
    uint256 flag = (_packedBools >> _boolNumber) & uint256(1);  
    return (flag == 1 ? true : false);  
}

function setBooleaOnIndex(  
    uint256 _packedBools,  
    uint256 _boolNumber,  
    bool _value  
) private pure returns(uint256) {  
    if (_value)  
        return _packedBools | uint256(1) << _boolNumber;  
    else  
        return _packedBools & ~(uint256(1) << _boolNumber);  
}

function wordToGrid(uint256 word) pure internal returns ( bool[dim][dim] memory){
  // convert word to bool[][] (prior to iterate state)
  bool[dim][dim] memory grid;
  for (uint256 i = 0; i < dim; i += 1){
    for (uint256 j = 0; j < dim; j += 1){
      //
      grid[i][j] = getBooleanFromIndex(word, (i * dim + j));
    }
  }

  return grid;
}

function gridToWord(bool[dim][dim] memory grid) view internal returns(uint256){
  // convert bool[][] to word (after completing iterating state)
  uint256 word;
  for (uint256 i = 0; i < dim; i += 1){
    for (uint256 j = 0; j < dim; j += 1){
      word = setBooleaOnIndex(word, (i * dim + j), grid[i][j]);
    }
  }
  return word;
}


}
