//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// import "@nomiclabs/buidler/console.sol";

import "../extensions/Owned.sol";

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./MaxAllowedSupply.sol";

/// @title   Umbrella Rewards contract
/// @author  umb.network
/// @notice  This contract allows to mint tokens and burn key (renounceOwnership)
/// @dev     Can be use used with MultiSig as owner
abstract contract MintableToken is Owned, MaxAllowedSupply {
  using SafeMath for uint256;

  // ========== RESTRICTED FUNCTIONS ========== //

  function mint(address _holder, uint256 _amount)
  external
  onlyOwner()
  assertMaxSupply(_amount) {
    require(_amount > 0, "zero amount");

    _mint(_holder, _amount);
  }
}
