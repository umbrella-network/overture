//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title   Umbrella Rewards contract
/// @author  umb.network
/// @notice  This contract job is to make sure, we don't mint over max allowed amount
abstract contract MaxAllowedSupply is ERC20 {
  using SafeMath for uint256;

  // ========== STATE VARIABLES ========== //

  uint256 public maxAllowedTotalSupply;

  // ========== CONSTRUCTOR ========== //

  constructor (uint256 _maxAllowedTotalSupply) {
    require(_maxAllowedTotalSupply != 0, "_maxAllowedTotalSupply is empty");
    maxAllowedTotalSupply = _maxAllowedTotalSupply;
  }

  // ========== MODIFIERS ========== //

  modifier assertMaxSupply(uint256 _amountToMint) {
    require(totalSupply().add(_amountToMint) <= maxAllowedTotalSupply, "total supply limit exceeded");
    _;
  }
}
