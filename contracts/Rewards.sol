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
///          It supports linear vesting and bulk vesting
/// @dev     Deploy contract. Mint tokens reward for this contract.
///          Then as owner call .startDistribution() - this will set everything
///          and it will burn owner key.
contract Rewards is Owned {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    ERC20 public rewardToken;

    uint256 public distributionStartTime;
    mapping(address => Reward) public rewards;
    address[] public participants;

    struct Reward {
        uint256 total;
        uint256 duration;
        uint256 paid;
        uint8 bulk; //
    }

    // ========== CONSTRUCTOR ========== //

    constructor(address _owner) Owned(_owner) {
    }

    // ========== VIEWS ========== //

    function participantsCount() public view returns (uint256) {
        return participants.length;
    }

    function balanceOf(address _address) public view returns (uint256) {
        uint256 start = distributionStartTime;

        if (block.timestamp <= start) {
            return 0;
        }

        Reward memory reward = rewards[_address];

        if (block.timestamp >= start.add(reward.duration)) {
            return reward.total.sub(reward.paid);
        }

        return reward.bulk == 0
            ? reward.total.mul(block.timestamp.sub(start)).div(reward.duration).sub(reward.paid)
            : bulkProgress(reward.total, reward.duration, reward.bulk);
    }

    // ========== MUTATIVE FUNCTIONS ========== //

    function claim() external {
        uint256 balance = balanceOf(_msgSender());
        require(balance != 0, "you have no tokens to claim");

        rewards[_msgSender()].paid = rewards[_msgSender()].paid.add(balance);
        rewardToken.safeTransfer(_msgSender(), balance);

        emit LogClaimed(_msgSender(), balance);
    }

    // ========== RESTRICTED FUNCTIONS ========== //

    function startDistribution(
        ERC20 _rewardToken,
        uint256 _startTime,
        address[] calldata _participants,
        uint256[] calldata _rewards,
        uint256[] calldata _durations,
        uint8[] calldata _bulks
    )
    external onlyOwner {
        require(_participants.length != 0, "there is no _participants");
        require(_participants.length == _rewards.length, "_participants count must match _rewards count");
        require(_participants.length == _durations.length, "_participants count must match _durations count");
        require(_participants.length == _bulks.length, "_participants count must match _bulks count");
        require(_startTime != 0, "start time is empty");

        distributionStartTime = _startTime;
        uint256 sum = 0;

        for (uint256 i = 0; i < _participants.length; i++) {
            require(_bulks[i] <= 100, "bulk must be between 0 - 100");
            rewards[_participants[i]] = Reward(_rewards[i], _durations[i], 0, _bulks[i]);
            sum = sum.add(_rewards[i]);
        }

        require(_rewardToken.balanceOf(address(this)) >= sum, "not enough tokens for rewards");

        rewardToken = _rewardToken;
        participants = _participants;

        renounceOwnership();
        emit LogBurnKey();
    }

    // ========== PRIVATE  ========== //

    // bulk distribution is release % of total amount on particular day
    // this day is also calculated by % eg:
    // if we have 10 days and bulk = 20, then release will be
    // 20% on day 2, 40% on day 4, 60% on day 6 etc
    function bulkProgress(uint256 _totalAmount, uint256 _duration, uint8 _bulk) internal view returns (uint256) {
        uint bulks = block.timestamp.sub(distributionStartTime).mul(100).div(_duration * _bulk);
        uint256 result = _totalAmount.mul(_bulk).mul(bulks) / 100;
        return result > _totalAmount ? _totalAmount : result;
    }

    // ========== EVENTS ========== //

    event LogClaimed(address indexed recipient, uint256 amount);
    event LogBurnKey();
}
