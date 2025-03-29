// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

contract MockNFT is IERC721 {
    string public name;
    string public symbol;
    address private _owner;
    mapping(address => uint256) private _balances;
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        _owner = msg.sender;
    }
    
    function setBalance(address account, uint256 balance) external {
        require(msg.sender == _owner, "Not authorized");
        _balances[account] = balance;
    }
    
    function balanceOf(address owner) external view override returns (uint256) {
        return _balances[owner];
    }
    
    // Stub implementations for IERC721 interface
    function ownerOf(uint256 tokenId) external view override returns (address) {
        revert("Not implemented");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        revert("Not implemented");
    }
    
    function transferFrom(address from, address to, uint256 tokenId) external override {
        revert("Not implemented");
    }
    
    function approve(address to, uint256 tokenId) external override {
        revert("Not implemented");
    }
    
    function getApproved(uint256 tokenId) external view override returns (address) {
        revert("Not implemented");
    }
    
    function setApprovalForAll(address operator, bool approved) external override {
        revert("Not implemented");
    }
    
    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        revert("Not implemented");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external override {
        revert("Not implemented");
    }
    
    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(IERC721).interfaceId;
    }
}