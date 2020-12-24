//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// import "@nomiclabs/buidler/console.sol";
import "../lib/Strings.sol";

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../extensions/Owned.sol";
import "../interfaces/ISwapReceiver.sol";


/// @title   Umbrella Rewards contract
/// @author  umb.network
/// @notice  This contract serves Swap functionality for rewards tokens
/// @dev     It allows to swap itself for other token (main UMB token).
///          Swap can start 1y from deployment or can be triggered earlier by owner.
///          There is a daily limit for swapping so we can't swap all at once.
///          When swap is executing, this contract do not care about target token,
///          so target token should be responsible for all the check before he mint tokens for swap.
abstract contract SwappableToken is Owned, ERC20 {
  using SafeMath for uint256;
  using Strings for string;

  uint256 public totalAmountToBeSwapped;
  uint256 public swappedSoFar;
  uint256 public swapStartsOn;
  uint256 public swapDuration;

  // ========== CONSTRUCTOR ========== //

  constructor(uint _totalAmountToBeSwapped, uint _swapDuration) {
    require(_totalAmountToBeSwapped != 0, "_totalAmountToBeSwapped is empty");
    require(_swapDuration != 0, "swapDuration is empty");

    totalAmountToBeSwapped = _totalAmountToBeSwapped;
    swapStartsOn = block.timestamp + 365 days;
    swapDuration = _swapDuration;
  }

  // ========== MODIFIERS ========== //

  // ========== VIEWS ========== //

  function isSwapStarted() public view returns (bool) {
    return swapStartsOn <= block.timestamp;
  }

  function canIswapMyTokenPrediction(address _address) public view returns (bool) {
    return balanceOf(_address) <= totalUnlockedAmountOfToken().sub(swappedSoFar);
  }

  // @todo - implement limit to be user friendly,
  // currently this is simple implementation that acts as FIFO
  // user sent tx and can't be sure that tx will success (in scenario where everybody want to swap)
  // maybe we can do better but for now it is how it is

  // thoughts: maybe we can ask user for acceptable time he can 'lock' tokens
  // and if we are not able to swap now, but we can do it in acceptable by user timeline,
  // then we will hold a place for swap for user,
  // so he can get back and execute second part of swap tx and now he will be sure it will not fail?
  // I think this is the way to go, so I will need to implement this on top of current functionality

  function totalUnlockedAmountOfToken() public view returns (uint256) {
    if(block.timestamp < swapStartsOn)
      return 0;
    if (block.timestamp >= swapStartsOn.add(swapDuration)) {
      return totalSupply().add(swappedSoFar);
    } else {
      return totalSupply().add(swappedSoFar).mul(block.timestamp.sub(swapStartsOn)).div(swapDuration);
    }
  }

  // ========== MUTATIVE FUNCTIONS ========== //

  function swapFor(ISwapReceiver _umb) external {
    uint amountToSwap = balanceOf(_msgSender());
    uint _swappedSoFar = swappedSoFar;

    require(amountToSwap != 0, "you dont have tokens to swap");
    require(swapStartsOn <= block.timestamp, string("swap starts in: ").appendNumber(swapStartsOn - block.timestamp));
    require(amountToSwap <= totalUnlockedAmountOfToken().sub(_swappedSoFar), "your swap is over the limit, sorry");

    _burn(_msgSender(), amountToSwap);
    _umb.swapMint(_msgSender(), amountToSwap);

    swappedSoFar = _swappedSoFar.add(amountToSwap);

    emit LogSwap(_msgSender(), amountToSwap);
  }

  // ========== PRIVATE / INTERNAL ========== //

  // ========== RESTRICTED FUNCTIONS ========== //

  function startSwapNow() external onlyOwner {
    require(block.timestamp < swapStartsOn, "swap is already allowed");

    swapStartsOn = block.timestamp;
    emit LogStartSwapNow(block.timestamp);
  }

  // ========== EVENTS ========== //

  event LogStartSwapNow(uint time);
  event LogSwap(address indexed swappedTo, uint amount);
}
