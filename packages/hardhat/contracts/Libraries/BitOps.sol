pragma solidity ^0.8.20;
// pragma solidity ^0.8.6;
//SPDX-License-Identifier: MIT
import '@openzeppelin/contracts/utils/Strings.sol';
import {Structs} from './Structs.sol';

library BitOps {
  function getBooleanFromIndex(
    uint256 _packedBools,
    uint256 _boolNumber
  ) public pure returns (bool) {
    // get bool value from integer word at position _boolNumber
    uint256 flag = (_packedBools >> _boolNumber) & uint256(1);
    return (flag == 1 ? true : false);
  }

  function setBooleaOnIndex(
    uint256 _packedBools,
    uint256 _boolNumber,
    bool _value
  ) public pure returns (uint256) {
    // set bool value on integer word at position _bolNumber
    if (_value) return _packedBools | (uint256(1) << _boolNumber);
    else return _packedBools & ~(uint256(1) << _boolNumber);
  }

  function getBooleanFromIndex64(
    uint64 _packedBools,
    uint64 _boolNumber
  ) public pure returns (bool) {
    // get bool value from integer word at position _boolNumber
    uint64 flag = (_packedBools >> _boolNumber) & uint64(1);
    return (flag == 1 ? true : false);
  }

  function setBooleanOnIndex64(
    uint64 _packedBools,
    uint64 _boolNumber,
    bool _value
  ) public pure returns (uint64) {
    // set bool value on integer word at position _boolNumber
    if (_value) return _packedBools | (uint64(1) << _boolNumber);
    else return _packedBools & ~(uint64(1) << _boolNumber);
  }

  function getCountOfOnBits(uint256 boolsUint) public pure returns (uint8) {
    // count all the on bits in boolsUint
    uint256 boolsUintCopy = boolsUint;
    uint8 _count = 0;
    for (uint8 i = 0; i < 255; i++) {
      if (boolsUintCopy & 1 == 1) {
        _count++;
      }
      boolsUintCopy >>= 1;
    }
    return _count;
  }

  function _b2u(bool input) internal pure returns (uint256) {
    return input ? 1 : 0;
  }

  function gridToWord(bool[8][8] memory grid) internal pure returns (uint64) {
    // convert bool[][] to word (after completing iterating state)
    uint64 word;
    for (uint8 i = 0; i < 8; i += 1) {
      for (uint8 j = 0; j < 8; j += 1) {
        word = setBooleanOnIndex64(word, (i * 8 + j), grid[i][j]);
      }
    }
    return word;
  }

  function wordToGrid(uint64 word) internal pure returns (bool[8][8] memory) {
    // convert word to bool[][] (prior to iterate state)
    bool[8][8] memory grid;
    for (uint256 i = 0; i < 8; i += 1) {
      for (uint256 j = 0; j < 8; j += 1) {
        //
        grid[i][j] = getBooleanFromIndex64(word, uint64(i * 8 + j));
      }
    }

    return grid;
  }

  function packState(
    uint64 gameState,
    uint8 epoch,
    uint16 generation
  ) internal pure returns (uint) {
    // Check that the inputs are within their respective ranges // skip checks to save gas. assume all numbers in range
    // require(epoch <= 255, 'Epoch should be within the range of uint8');
    // require(generation <= 65535, 'Generation should be within the range of uint16');

    uint result = uint(gameState);
    result = (result << 8) | uint(epoch);
    result = (result << 16) | uint(generation);
    return result;
  }

  function unpackState(uint packedState) internal pure returns (uint64, uint8, uint16) {
    uint64 gameState = uint64(packedState >> 24);
    uint8 epoch = uint8((packedState >> 16) & 0xFF);
    uint16 generation = uint16(packedState & 0xFFFF);
    return (gameState, epoch, generation);
  }
}
