pragma solidity >=0.7.0 <0.8.0;

//SPDX-License-Identifier: MIT

library Foo {
  string constant longString =
    'Information is power. But like all power, there are those who want to keep it for themselves. The worlds entire scientific and cultural heritage, published over centuries in books and journals, is increasingly being digitized and locked up by a handful of private corporations. Want to read the papers featuring the most famous results of the sciences? Youll need to send enormous amounts to publishers like Reed Elsevier. There are those struggling to change this. The Open Access Movement has fought valiantly to ensure that scientists do not sign their copyrights away but instead ensure their work is published on the Internet, under terms that allow anyone to access it. But even under the best scenarios, their work will only apply to things published in the future. Everything up until now will have been lost.';

  string constant longString2 =
    'There are those struggling to change this. The Open Access Movement has fought valiantly to ensure that scientists do not sign their copyrights away but instead ensure their work is published on the Internet, under terms that allow anyone to access it. But even under the best scenarios, their work will only apply to things published in the future. Everything up until now will have been lost.';

  string constant longString3 =
    'That is too high a price to pay. Forcing academics to pay money to read the work of their colleagues? Scanning entire libraries but only allowing the folks at Google to read them? Providing scientific articles to those at elite universities in the First World, but not to children in the Global South? Its outrageous and unacceptable.';

  function makeFoo() public pure returns (string memory) {
    string
      memory longString4 = 'Those with access to these resources  students, librarians, scientists  you have been given a privilege. You get to feed at this banquet of knowledge while the rest of the world is locked out. But you need not  indeed, morally, you cannot  keep this privilege for yourselves. You have a duty to share it with the world. And you have: trading passwords with colleagues, filling download requests for friends.';

    return longString4;
  }

  function makeFooTwo() public pure returns (string memory) {
    string
      memory longString5 = 'Meanwhile, those who have been locked out are not standing idly by. You have been sneaking through holes and climbing over fences, liberating the information locked up by the publishers and sharing them with your friends. But all of this action goes on in the dark, hidden underground. Its called stealing or piracy, as if sharing a wealth of knowledge were the moral equivalent of plundering a ship and murdering its crew. But sharing isnt immoral its a moral imperative. Only those blinded by greed would refuse to let a friend make a copy.';

    return longString5;
  }

  function megaMega(
    uint256 a,
    uint256 b,
    uint256 c,
    string memory s1,
    string memory s2
  ) public pure returns (string memory) {
    //
    uint256 total = a + b + c;

    string memory foo = string(abi.encodePacked(s1, s2, total));
    return foo;
  }

  function megaMega2(
    uint256 x,
    uint256 y,
    uint256 z,
    string memory s1,
    string memory s2
  ) public pure returns (string memory) {
    //
    uint256 total = x + y;
    uint256 total2 = total + z;

    string memory foo = string(abi.encodePacked(s1, s2, total, total2));
    return foo;
  }
}
