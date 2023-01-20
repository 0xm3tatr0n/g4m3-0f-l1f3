pragma solidity >=0.7.0 <0.8.0;
// pragma abicoder v2;
//SPDX-License-Identifier: MIT
// externalized elements specifically for G0l
import '@openzeppelin/contracts/utils/Strings.sol';
import {Structs} from '../StructsLibrary.sol';

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
}
