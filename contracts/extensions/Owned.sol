//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Owned is Ownable {
  constructor(address _owner) {
    transferOwnership(_owner);
  }
}
