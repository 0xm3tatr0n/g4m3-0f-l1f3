pragma solidity >=0.7.0 <0.8.0;
//SPDX-License-Identifier: MIT


// imports
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {G0l, BitOps} from './Libraries.sol';
import {Structs} from './StructsLibrary.sol';

contract G4m3 {
    using Counters for Counters.Counter;
    // constants
    uint256 constant internal dim = 8;
    uint256 constant internal scale = 40;
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
    function showStateInt() public view returns (uint256){
        return gameStateInt;
    }

    // state muting functions
    function _initState() internal {
        // set generation
        _currentGeneration.increment();

        // temporary storage
        bool[dim][dim] memory results;

        // generate some "randomness"
        bytes32 seedBytes = keccak256(abi.encodePacked(address(this) ,_currentGeneration.current(), "bar", blockhash(block.number - 1), block.timestamp));

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

    for (uint256 i = 0; i < dim; i += 1){
      for (uint256 j = 0; j < dim; j += 1){
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

    // check if generation ended (no change between iteration)
    // naming suboptimal: 
    // gameStateIntOld --> old N-2
    // gameStateInt --> old N-1
    // gameStateIntNew --> current
    uint256 gameStateIntNew = gridToWord(newGameStateFromInt);
    
    
    if (_tokenIds.current() > 2){
      // game advanced enough to look back 2 periods
      uint256 gameStateIntOld = tokenGridStatesInt[_tokenIds.current()];
      if (gameStateInt == gameStateIntNew || gameStateIntOld == gameStateIntNew){
        // init new state
        _initState();
      } else {
        gameStateInt = gameStateIntNew;
      }
    } else {
      // we can't look back 2 periods yet..
      if (gameStateInt == gameStateIntNew){
        // init new state
        _initState();
      } else {
        gameStateInt = gameStateIntNew;
      }
    }

  }


    // data render functions (state viewing functions, strictly speaking)


    // utility functions
    function _b2u(bool input) internal pure returns(uint){
        return input ? 1 : 0;
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

}