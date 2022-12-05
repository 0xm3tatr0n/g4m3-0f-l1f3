
pragma solidity >=0.7.0 <0.8.0;
//SPDX-License-Identifier: MIT
// externalized elements specifically for G0l
library G0l {
    string constant babySVG = '<svg viewBox="0 0 31.1 31.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 0a15.3 15.3 0 0 0-3.3 30.2 5.3 5.3 0 0 1-1.5-3 13 13 0 0 1-.5-23.7c-.2 1 .6 2.1 1.4 3.2.8 1 .5 1.6-.1 2.1a.6.6 0 0 0 .3 1C19.6 10 21.5 5.7 22 4a13 13 0 0 1-.7 23 5.3 5.3 0 0 1-1.4 3 15.3 15.3 0 0 0-4.3-30z"/><circle cx="11.5" cy="14.9" r="1.7"/><circle cx="19.5" cy="14.9" r="1.7"/><path d="M10.8 24.7a5.3 5.3 0 0 1 2.3-3c.1-1.3 1.3-2.4 2.7-2.4 1.4 0 2.5 1 2.6 2.4 1.2.6 2.1 1.7 2.6 3 .7-.7 1-1.6 1-2.5 0-2.4-2.7-4.4-6-4.4-3.5 0-6.2 2-6.2 4.4 0 1 .4 1.8 1 2.5z"/><path d="M16.5 24.6a1.9 1.9 0 0 0-1.2 0c.1 0 .1 0 0 0-.8.3-1.3 1-1.3 1.7v.1a8.3 8.3 0 0 0 3.8 0c0-.9-.6-1.6-1.3-1.8zM15.8 20c-1 0-1.7.6-2 1.5a5.3 5.3 0 0 1 4.1 0 2.3 2.3 0 0 0-2-1.4z"/><path d="M15.9 21.6a4.8 4.8 0 1 0 0 9.5 4.8 4.8 0 0 0 0-9.5zm0 7.2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
}

library BitOps {
    function getBooleanFromIndex(uint256 _packedBools, uint256 _boolNumber)  
        public pure returns(bool)  
        {  
            uint256 flag = (_packedBools >> _boolNumber) & uint256(1);  
            return (flag == 1 ? true : false);  
        }

    function setBooleaOnIndex(  
        uint256 _packedBools,  
        uint256 _boolNumber,  
        bool _value  
    ) public pure returns(uint256) {  
        if (_value)  
            return _packedBools | uint256(1) << _boolNumber;  
        else  
            return _packedBools & ~(uint256(1) << _boolNumber);  
    }

}