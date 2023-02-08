pragma solidity >=0.7.0 <0.8.0;
//SPDX-License-Identifier: MIT
import '@openzeppelin/contracts/utils/Strings.sol';
import {Structs} from './Structs.sol';

library BitOps {
  function getBooleanFromIndex(uint256 _packedBools, uint256 _boolNumber)
    public
    pure
    returns (bool)
  {
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

  function getCountOfOnBits(uint256 boolsUint) public pure returns (uint256) {
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

  function gridToWord(bool[8][8] memory grid) internal pure returns (uint256) {
    // convert bool[][] to word (after completing iterating state)
    uint256 word;
    for (uint256 i = 0; i < 8; i += 1) {
      for (uint256 j = 0; j < 8; j += 1) {
        word = setBooleaOnIndex(word, (i * 8 + j), grid[i][j]);
      }
    }
    return word;
  }

  function wordToGrid(uint256 word) internal pure returns (bool[8][8] memory) {
    // convert word to bool[][] (prior to iterate state)
    bool[8][8] memory grid;
    for (uint256 i = 0; i < 8; i += 1) {
      for (uint256 j = 0; j < 8; j += 1) {
        //
        grid[i][j] = getBooleanFromIndex(word, (i * 8 + j));
      }
    }

    return grid;
  }
}