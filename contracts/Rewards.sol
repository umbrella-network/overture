//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/Owned.sol";

/// @title   Umbrella Rewards contract
/// @author  umb.network
/// @notice  This contract serves TOKEN DISTRIBUTION AT LAUNCH for:
///           - node, founders, early contributors etc...
///          It can be used for future distributions for next milestones also
///          as its functionality stays the same.
/// @dev     Deploy contract. Mint tokens reward for this contract.
///          Then as owner call .startDistribution() - this will set everything
///          and it will burn owner key.
contract Rewards is Owned {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  ERC20 public rewardToken;

  uint public distributionStartTime;
  mapping (address => Reward) rewards;
  address[] public participants;

  struct Reward {
    uint total;
    uint duration;
    uint paid;
  }

  // ========== CONSTRUCTOR ========== //

  constructor(address _owner) Owned(_owner) {
  }

  // ========== VIEWS ========== //

  function balanceOf(address _address) public view returns (uint) {
    uint start = distributionStartTime;

    if (block.timestamp < start) {
      return 0;
    }

    Reward memory reward = rewards[_address];

    if (block.timestamp >= start.add(reward.duration)) {
      return reward.total.sub(reward.paid);
    }

    return reward.total.mul(block.timestamp.sub(start)).div(reward.duration).sub(reward.paid);
  }

  // ========== MUTATIVE FUNCTIONS ========== //

  function claim() external {
    uint balance = balanceOf(_msgSender());
    require(balance != 0, "you have no tokens to claim");

    rewards[_msgSender()].paid = rewards[_msgSender()].paid.add(balance);
    rewardToken.safeTransfer(_msgSender(), balance);

    emit LogClaimed(_msgSender(), balance);
  }

  function startDistribution(
    ERC20 _rewardToken,
    uint _startTime,
    address[] calldata _participants,
    uint[] calldata _rewards,
    uint[] calldata _durations
  )
  external
  onlyOwner {
    require(_participants.length != 0, "there is no _participants");
    require(_participants.length != _rewards.length, "_participants count must much _rewards count");
    require(_participants.length != _durations.length, "_participants count must much _durations count");
    require(_startTime != 0, "start time is empty");

    distributionStartTime = _startTime;
    uint sum = 0;

    for (uint i=0; i < _participants.length; i++) {
      rewards[_participants[i]] = Reward(_rewards[i], _durations[i], 0);
      sum = sum.add(_rewards[i]);
    }

    require(_rewardToken.balanceOf(address(this)) >= sum, "not enough tokens for rewards");

    rewardToken = _rewardToken;
    participants = _participants;

    transferOwnership(address(0));
    emit LogBurnKey(address(0));
  }

  // ========== EVENTS ========== //

  event LogClaimed(address indexed recipient, uint amount);
  event LogBurnKey(address owner);
}
