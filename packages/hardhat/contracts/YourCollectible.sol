pragma solidity >=0.7.0 <0.8.0;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import 'base64-sol/base64.sol';

import './Libraries/HexStrings.sol';
import './G4m3.sol';
// import './ToColor.sol';
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721 16631332

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two
import {Structs} from './Libraries/Structs.sol';

contract YourCollectible is ERC721, Pausable, Ownable, G4m3 {
  using Strings for uint256;
  using HexStrings for uint160;

  // using ToColor for bytes3;

  constructor() ERC721('gam3 0f l1f3', 'g0l') {
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
  uint256 public constant maxItems = 10;
  uint256 public constant mintPrice = 0.01 ether;

  // variables
  uint256 private minted4free = 0;
  uint256 private createTime;

  function mintItem(address mintTo) public payable whenNotPaused returns (uint256) {
    require(msg.value >= mintPrice, 'No such thing as a free mint!');
    tokenIdsIncrement();

    uint256 id = tokenIdsCurrent();
    _mint(mintTo, id);
    _iterateState();

    // store token states
    tokenGridStatesInt[id] = gameStateInt;
    tokenGeneration[id] = generationCurrent();

    return id;
  }

  function mintMany(address mintTo, uint256 noItems) public payable whenNotPaused {
    require(noItems <= maxItems, 'too many mints requested');
    require(msg.value >= mintPrice * noItems, 'not enough funds sent');

    for (uint256 i = 0; i < noItems; i++) {
      tokenIdsIncrement();

      uint256 id = tokenIdsCurrent();
      _mint(mintTo, id);
      _iterateState();

      // store token states
      tokenGridStatesInt[id] = gameStateInt;
      tokenGeneration[id] = generationCurrent();
    }
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
    require(_exists(id), 'token does not exist');
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
                G0l.generateAttributeString(metadata),
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

  // Visibility is `public` to enable it being called by other contracts for composition.
  function withdrawAmount(uint256 amount) public onlyOwner {
    require(amount <= address(this).balance, 'withdraw amnt too high');
    msg.sender.transfer(amount);
    emit Withdrawal(msg.sender, amount);
  }

  function mintForFree(address mintTo, uint256 noItems) public onlyOwner {
    // owner mint allocation of 1 item / day
    uint256 currentAlloc = (block.timestamp - createTime) / (1 days);
    require((minted4free + noItems) <= currentAlloc, 'not enough free mints');

    for (uint256 i = 0; i < noItems; i++) {
      tokenIdsIncrement();

      uint256 id = tokenIdsCurrent();
      _mint(mintTo, id);
      minted4free += 1;
      _iterateState();

      // store token states
      tokenGridStatesInt[id] = gameStateInt;
      tokenGeneration[id] = generationCurrent();
    }
  }
}
