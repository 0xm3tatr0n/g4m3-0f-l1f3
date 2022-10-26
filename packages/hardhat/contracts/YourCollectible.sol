pragma solidity >=0.7.0 <0.8.0;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import 'base64-sol/base64.sol';

import './HexStrings.sol';
import './ToColor.sol';
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract YourCollectible is ERC721, Ownable {

  using Strings for uint256;
  using HexStrings for uint160;
  using ToColor for bytes3;
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor() public ERC721("gam3 0f l1f3", "g0l") {
    console.log("LFG!");
    _initState();
  }

  // constants
  string[] colors = ["#190c28", "#fef7ee", "#fb0002", "#fef000", "#1c82eb"];

  // variables
  mapping (uint256 => bytes3) public color;
  mapping (uint256 => uint256) public chubbiness;

  bool[32][32] public gameState;
  uint256 public mockState;

  uint256 mintDeadline = block.timestamp + 24 hours;


  function _initState() private {
    // temporary storage
    bool[32][32] memory results;

    // seed
    uint256 seed = uint256(keccak256(abi.encodePacked("foo", "bar", blockhash(block.number - 1))));
    bytes32 seedBytes = keccak256(abi.encodePacked("foo", "bar", blockhash(block.number - 1)));

    mockState = seed;
    // generate some randomness
    // gotta create 1024 squares

    // loop over bytes
    require(seedBytes.length % 32 == 0, 'not enough bytes');

    uint256 r = uint256(seedBytes);
    uint256[] memory b;

    for (uint256 i = 0; i < 32; i += 1){
      uint8 m = uint8( r >> i * 8);

      for (uint256 j = 0; j < 32; j += 1){
        uint256 s = uint256(keccak256(abi.encodePacked(Strings.toString(m), address(this))));
        uint8 n = uint8( s >> j * 8);
        bool result;
        if (n > 120){
          result = true;
        } else {
          result = false;
        }

        results[i][j] = result;
      }
    }

    gameState = results;

  }

  function _iterateState() private {
    // play game of life
  }

  function checkState() public view returns (bool[32][32] memory){
    return gameState;
  }

  function mintItem()
      public
      returns (uint256)
  {
      require( block.timestamp < mintDeadline, "DONE MINTING");
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(msg.sender, id);

      bytes32 predictableRandom = keccak256(abi.encodePacked( blockhash(block.number-1), msg.sender, address(this), id ));
      color[id] = bytes2(predictableRandom[0]) | ( bytes2(predictableRandom[1]) >> 8 ) | ( bytes3(predictableRandom[2]) >> 16 );
      chubbiness[id] = 35+((55*uint256(uint8(predictableRandom[3])))/255);

      return id;
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
      require(_exists(id), "not exist");
      string memory name = string(abi.encodePacked('Loogie #',id.toString()));
      string memory description = string(abi.encodePacked('This Loogie is the color #',color[id].toColor(),' with a chubbiness of ',uint2str(chubbiness[id]),' yay!'));
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
                              color[id].toColor(),
                              '"},{"trait_type": "chubbiness", "value": ',
                              uint2str(chubbiness[id]),
                              '}], "owner":"',
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
      '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg" onload="init()">',
        // renderTokenById(id),
        renderSimpleSVG(id),
      '</svg>'
    ));

    return svg;
  }

  // Visibility is `public` to enable it being called by other contracts for composition.
  function renderTokenById(uint256 id) public view returns (string memory) {
    string memory render = string(abi.encodePacked(
      '<g id="eye1">',
          '<ellipse stroke-width="3" ry="29.5" rx="29.5" id="svg_1" cy="154.5" cx="181.5" stroke="#000" fill="#fff"/>',
          '<ellipse ry="3.5" rx="2.5" id="svg_3" cy="154.5" cx="173.5" stroke-width="3" stroke="#000" fill="#000000"/>',
        '</g>',
        '<g id="head">',
          '<ellipse fill="#',
          color[id].toColor(),
          '" stroke-width="3" cx="204.5" cy="211.80065" id="svg_5" rx="',
          chubbiness[id].toString(),
          '" ry="51.80065" stroke="#000"/>',
        '</g>',
        '<g id="eye2">',
          '<ellipse stroke-width="3" ry="29.5" rx="29.5" id="svg_2" cy="168.5" cx="209.5" stroke="#000" fill="#fff"/>',
          '<ellipse ry="3.5" rx="3" id="svg_4" cy="169.5" cx="208" stroke-width="3" fill="#000000" stroke="#000"/>',
        '</g>'
      ));

    return render;
  }

  function renderTokenSVG(uint256 id) public view returns (string memory){
    string memory render = string(abi.encodePacked(
      '<defs><script type="text/javascript"><![CDATA[',
        'function init(){',
          'for (let i = 0; i < 32; i++){',
            'for (let j=0; j < 32; j++){',
              'const element = document.createElementNS("http://www.w3.org/2000/svg","rect")',
              'element.setAttribute("width", "10")',
              'element.setAttribute("height", "10")',
              'element.setAttribute("x", String(i * 10));',
              'element.setAttribute("y", String(j * 10))',
              'element.setAttribute("fill", "white")',
              'if (i % 7 === 0 && j % 4){',
                'element.setAttribute("fill", "black")',
              '}',
              'document.getElementById("grid").appendChild(element)',
      ']]></script></defs>',
      '<g id="canvas">',
        '<g id="grid"></g>',
      '</g>'
    ));

    return render;
  }

  function renderSimpleSVG(uint256 id) public view returns (string memory){
    string memory render = string(abi.encodePacked(
      '<defs><script type="text/javascript"><![CDATA[',
        'function init(){ document.getElementById("grid").setAttribute("fill", "green")}',
      ']]></script></defs>',
      '<g>',
        '<rect id="grid" x="10" y="10" width="10" height="10" fill="red"/>',
      '</g>'
      ));

      return render;
  }

  function renderGameGrid(bool[32][32] memory grid) public view returns (string memory){
    // render that thing
    string[] memory squares;

    for (uint256 i = 0; i < grid.length; i += 1){
      //
      bool[] memory row = grid[i];
      for (uint256 j = 0; j < row.length; j += 1){
        bool alive = grid[i][j];
        // string square =
      }

    }
  }

  function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
      if (_i == 0) {
          return "0";
      }
      uint j = _i;
      uint len;
      while (j != 0) {
          len++;
          j /= 10;
      }
      bytes memory bstr = new bytes(len);
      uint k = len;
      while (_i != 0) {
          k = k-1;
          uint8 temp = (48 + uint8(_i - _i / 10 * 10));
          bytes1 b1 = bytes1(temp);
          bstr[k] = b1;
          _i /= 10;
      }
      return string(bstr);
  }
}
