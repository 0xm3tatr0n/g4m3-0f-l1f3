pragma solidity >=0.7.0 <0.8.0;
pragma abicoder v2;
//SPDX-License-Identifier: MIT
// externalized elements specifically for G0l
import '@openzeppelin/contracts/utils/Strings.sol';
import {Structs} from './StructsLibrary.sol';

library G0l {
  //   function renderBabySVG(
  //     string memory x,
  //     string memory y,
  //     string memory scale,
  //     string memory color
  //   ) internal pure returns (string memory) {
  //     string memory baby = string(
  //       abi.encodePacked(
  //         '<svg viewBox="',
  //         '-1 -1 300 300" ',
  //         'fill="#ffffff" ',
  //         'xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 0a15.3 15.3 0 0 0-3.3 30.2 5.3 5.3 0 0 1-1.5-3 13 13 0 0 1-.5-23.7c-.2 1 .6 2.1 1.4 3.2.8 1 .5 1.6-.1 2.1a.6.6 0 0 0 .3 1C19.6 10 21.5 5.7 22 4a13 13 0 0 1-.7 23 5.3 5.3 0 0 1-1.4 3 15.3 15.3 0 0 0-4.3-30z"/><circle cx="11.5" cy="14.9" r="1.7"/><circle cx="19.5" cy="14.9" r="1.7"/><path d="M10.8 24.7a5.3 5.3 0 0 1 2.3-3c.1-1.3 1.3-2.4 2.7-2.4 1.4 0 2.5 1 2.6 2.4 1.2.6 2.1 1.7 2.6 3 .7-.7 1-1.6 1-2.5 0-2.4-2.7-4.4-6-4.4-3.5 0-6.2 2-6.2 4.4 0 1 .4 1.8 1 2.5z"/><path d="M16.5 24.6a1.9 1.9 0 0 0-1.2 0c.1 0 .1 0 0 0-.8.3-1.3 1-1.3 1.7v.1a8.3 8.3 0 0 0 3.8 0c0-.9-.6-1.6-1.3-1.8zM15.8 20c-1 0-1.7.6-2 1.5a5.3 5.3 0 0 1 4.1 0 2.3 2.3 0 0 0-2-1.4z"/><path d="M15.9 21.6a4.8 4.8 0 1 0 0 9.5 4.8 4.8 0 0 0 0-9.5zm0 7.2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>'
  //       )
  //     );

  //     return baby;
  //   }

  //   function renderZombieSVG(Structs.ColorMap memory colorMap) internal pure returns (string memory) {
  //     string memory baby = string(
  //       abi.encodePacked(
  //         '<svg viewBox="0 0 4700 4700" fill="',
  //         colorMap.perishedColor,
  //         '" xmlns="http://www.w3.org/2000/svg"><path d="M384.932 45.57c-3.286.244-7.88 2.403-15.094 14.546-5.056 15.957-.322 25.086 5.06 38.496l2.307 5.744-55.96 51.87c4.376 8.594 7.407 18.226 8.78 28.44l80.254-80.214c-4.114-10.653-8.672-18.525-12.147-27.168-3.263-8.116-4.76-17.495-2.795-28.32-4.347-2.066-8.086-3.564-10.406-3.393zm-119.604 91.15c-25.092.105-47.134 26.142-46.957 60.414.178 34.27 22.487 60.12 47.58 60.013 25.092-.105 47.133-26.14 46.956-60.412-.177-34.272-22.485-60.12-47.578-60.015zm190.053 84.296c-5.97-.085-11.825.86-16.946 2.87-10.125 15.2-8.244 19.567-11.067 36.418l-.71 4.25-3.758 2.11c-21.674 12.172-42.448 22.542-62.93 39.315l-3.632 2.974-4.516-1.275s-12.793-3.613-25.804-7.423c-6.506-1.905-13.063-3.858-18.168-5.455-2.553-.8-4.73-1.505-6.45-2.106-.86-.3-1.59-.567-2.318-.867-.363-.15-.72-.302-1.197-.544-.47-.238-.912-.218-2.463-1.732l-.096.1-12.922-17.024c-5.195 1.613-10.67 2.493-16.36 2.517-21.26.09-39.657-11.704-51.53-29.73-56.886 37.057-116.74 79.386-150.313 123.28l8.283 24.558 55.025-15.826 20.713 46.717c42.768-26.075 84.4-51.742 116.833-74.634-6.47-2-12.324-4.36-17.36-7.163l8.754-15.726c9.89 5.505 29.343 10.33 51.204 12.707 20.935 2.277 44.212 2.546 64.754.84 24.303-20.896 54.028-46.405 72.838-65.997 1.26-7.008 3.54-13.69 7.895-19.768l.44-.617.538-.533c3.732-3.7 8.657-6.304 13.737-6.272 5.08.032 9.018 2.307 11.968 4.506 2.687 2.002 4.914 4.12 6.993 6.09l8.677-13.134c-3.495-8.958-11.785-16.096-22.45-20.12-5.596-2.11-11.687-3.225-17.66-3.31zM36.79 381.1l-2.56 17.82c-.555-.08-.808-.126-1.085-.173.112.03.233.054.32.092.617.265 1.608.72 2.838 1.303 2.46 1.168 5.905 2.864 9.95 4.89 3.966 1.987 8.656 4.375 13.52 6.86L51.57 387.58c-2.886-1.436-5.518-2.733-7.546-3.696-1.338-.635-2.458-1.152-3.418-1.567-.96-.415-.327-.715-3.817-1.217zm68.374 21.485l-40.7 11.707.026.014-15.095 13.234c-4.943-2.555-9.69-4.996-13.698-7.024-3.356-1.698-6.226-3.125-8.427-4.18-1.1-.53-2.026-.962-2.84-1.318-.815-.356-.077-.615-3.537-1.125L18.27 431.7c-.503-.074-.715-.114-.996-.162.475.21 1.24.56 2.21 1.025 1.987.953 4.79 2.35 8.086 4.016 2.155 1.09 4.764 2.433 7.272 3.72L20.78 452.628l11.867 13.535 19.37-16.982c16.705 8.704 32.9 17.262 32.9 17.262l8.413-15.912s-12.692-6.693-26.802-14.07l15.158-13.29c18.2 9.415 34.89 18.137 34.89 18.137l8.352-15.947s-13.362-6.973-28.71-14.93zm-87.89 28.953l-.053-.025c-.395-.173-1.407-.226.054.025z"/></svg>'
  //       )
  //     );

  //     return baby;
  //   }

  function returnColor(uint256 paletteNumber, uint256 colorPos)
    public
    pure
    returns (string memory)
  {
    string[7][12] memory colorPalettes = [
      // background, live, dead, born0, born1, perished0, perished1
      // low density times / rural
      // stable
      ['#EDEBD7', '#E3B23C', '#423E37', '#17BEBB', '#74A57F', '#FE6D73', '#7D5BA6'],
      // good
      ['#071E22', '#FF1053', '#251101', '#5BC0EB', '#D2F898', '#495159', '#3D3522'],
      // bad
      ['#1C7C54', '#A80874', '#E3D8F1', '#86BBD8', '#33658A', '#FF7F11', '#F0F66E'],
      // zero
      ['#E6FDFF', '#87FF65', '#C04CFD', '#5E2BFF', '#D2F898', '#ED254E', '#EADEDA'],
      // new ones, high density times // urban
      // stable
      ['#34287E', '#1E62AB', '#423E37', '#92B83C', '#469D45', '#FAED24', '#C7381D'],
      // good
      ['#ff206e', '#fbff12', '#41ead4', '#fbff12', '#fbff12', '#fbff12', '#fbff12'],
      // bad
      ['#201335', '#f78154', '#201335', '#5fad56', '#4d9078', '#f78154', '#b4436c'],
      // zero
      ['#212529', '#f8f9fa', '#343a40', '#dee2e6', '#dee2e6', '#495057', '#495057'],
      // not in use yet:
      // monochrome
      ['#061A40', '#003559', '#B9D6F2', '#006DAA', '#B9D6F2', '#003559', '#BFD7EA'],
      ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'],
      ['#FFFFFF', '#C2E812', '#BFCBC2', '#91F5AD', '#91F5AD', '#FF934F', '#FF934F'],
      ['#6699CC', '#A23E48', '#FFF275', '#FF3C38', '#FF8C42', '#6699CC', '#6699CC']
    ];

    // return colorsRainbow[palettePos];
    return colorPalettes[paletteNumber][colorPos];
  }

  function returnPerishedAnimation(
    Structs.ColorMap memory colorMap,
    uint256 i,
    uint256 j,
    uint256 representation
  ) public pure returns (string memory) {
    //
    if (representation == 2) {
      return
        string(
          abi.encodePacked(
            '<animate attributeType="XML" attributeName="fill" values="',
            colorMap.deadColor,
            ';',
            colorMap.perishedColor,
            ';',
            colorMap.deadColor,
            ';',
            colorMap.deadColor,
            '" dur="1.',
            Strings.toString((i * j) % 9),
            's" repeatCount="indefinite"/>'
          )
        );
    } else {
      return '';
    }
  }

  function getTrends(uint256 bornCells, uint256 perishedCells)
    public
    pure
    returns (Structs.Trends memory)
  {
    Structs.Trends memory trends;
    trends.births = bornCells;
    trends.deaths = perishedCells;

    if (bornCells > perishedCells) {
      trends.up = 1;
      trends.popDiff = bornCells - perishedCells;
    } else if (bornCells < perishedCells) {
      trends.up = 0;
      trends.popDiff = uint256(-int256(bornCells - perishedCells));
    } else {
      trends.up = 99;
      trends.popDiff = 0;
    }

    return trends;
  }

  function generateAttributeString(Structs.MetaData memory metadata)
    public
    pure
    returns (string memory)
  {
    string memory timesName;
    if (metadata.times == 0) {
      timesName = 'stable';
    } else if (metadata.times == 1) {
      timesName = 'good';
    } else if (metadata.times == 2) {
      timesName = 'bad';
    } else if (metadata.times == 3) {
      timesName = 'zero';
    }

    string memory representationName;

    if (metadata.representation == 0) {
      representationName = 'raw';
    } else if (metadata.representation == 1) {
      representationName = 'static';
    } else if (metadata.representation == 2) {
      representationName = 'animated';
    }

    string memory attributeString = string(
      abi.encodePacked(
        '", "attributes": [{"trait_type": "generation", "value": "#',
        metadata.generation,
        '"},',
        '{"trait_type" : "density", "value": "',
        Strings.toString(metadata.populationDensity),
        '"},',
        '{"trait_type" : "births", "value": "',
        Strings.toString(metadata.birthCount),
        '"},',
        '{"trait_type" : "deaths", "value": "',
        Strings.toString(metadata.deathCount),
        '"},',
        '{"trait_type" : "trend", "value": "',
        metadata.trend,
        '"},',
        '{"trait_type" : "population_difference", "value": "',
        Strings.toString(metadata.popDiff),
        '"},',
        '{"trait_type" : "times", "value": "',
        timesName,
        '"},',
        '{"trait_type" : "representation", "value": "',
        representationName,
        '"}',
        '],'
      )
    );
    return attributeString;
  }

  function generateColorMap(Structs.MetaData memory metadata)
    public
    pure
    returns (Structs.ColorMap memory)
  {
    Structs.ColorMap memory colorMap;

    uint256 selectedColorScheme = metadata.populationDensity < 25
      ? metadata.times
      : metadata.times + 4;

    // modify selected palette
    if (metadata.seed % 42 < 13) {
      selectedColorScheme = selectedColorScheme + 4;
    }

    colorMap.backgroundColor = returnColor(selectedColorScheme, 0);
    colorMap.aliveColor = returnColor(selectedColorScheme, 1);
    colorMap.deadColor = returnColor(selectedColorScheme, 2);

    // handle birth's intensity
    if (metadata.birthCount < 6) {
      colorMap.bornColor = returnColor(selectedColorScheme, 3);
    } else {
      colorMap.bornColor = returnColor(selectedColorScheme, 4);
    }

    // handle death intensity
    if (metadata.deathCount < 6) {
      colorMap.perishedColor = returnColor(selectedColorScheme, 5);
    } else {
      colorMap.perishedColor = returnColor(selectedColorScheme, 6);
    }

    return colorMap;
  }
}

library BitOps {
  function getBooleanFromIndex(uint256 _packedBools, uint256 _boolNumber)
    internal
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
  ) internal pure returns (uint256) {
    // set bool value on integer word at position _bolNumber
    if (_value) return _packedBools | (uint256(1) << _boolNumber);
    else return _packedBools & ~(uint256(1) << _boolNumber);
  }

  function getCountOfOnBits(uint256 boolsUint) internal pure returns (uint256) {
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
