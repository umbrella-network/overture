//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/Owned.sol";
import "./UMB.sol";

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

    struct Reward {
        uint256 total;
        uint256 duration;
        uint256 paid;
    }

    bool public setupDone = false;

    // ========== CONSTRUCTOR ========== //

    constructor(address _owner) Owned(_owner) {
    }

    // ========== VIEWS ========== //

    function balanceOf(address _address) public view returns (uint256) {
        uint256 startTime = distributionStartTime;

        if (startTime == 0) {
            return 0;
        }

        Reward memory reward = rewards[_address];

        if (block.timestamp >= startTime.add(reward.duration)) {
            return reward.total.sub(reward.paid);
        }

        return _totalBalanceOf(reward, startTime).sub(reward.paid);
    }

    function _totalBalanceOf(Reward memory _reward, uint256 _startTime) internal view returns (uint256) {
        return _reward.total.mul(block.timestamp.sub(_startTime)).div(_reward.duration);
    }

    // ========== MUTATIVE FUNCTIONS ========== //

    function claim() external {
        uint256 balance = balanceOf(msg.sender);
        require(balance != 0, "you have no tokens to claim");

        rewards[msg.sender].paid = rewards[msg.sender].paid.add(balance);
        rewardToken.safeTransfer(msg.sender, balance);

        emit LogClaimed(msg.sender, balance);
    }

    // ========== RESTRICTED FUNCTIONS ========== //

    function start() external onlyOwner {
        require(setupDone, "contract not setup");

        distributionStartTime = block.timestamp;

        emit LogStart(block.timestamp);
    }

    function cancel(address _participant) external onlyOwner {
        Reward memory reward = rewards[_participant];
        uint256 startTime = distributionStartTime;
        uint256 rewardsSoFar = _totalBalanceOf(reward, startTime);
        uint256 remain = reward.total.sub(rewardsSoFar);

        UMB(address(rewardToken)).burn(remain);

        rewards[_participant].total = rewardsSoFar;
        rewards[_participant].duration = block.timestamp - startTime;

        emit LogCancelDistribution(_participant);
    }

    function changeAddress(address _participant, address _new) external onlyOwner {
        require(rewards[_participant].total > 0, "_participant does not exists");
        require(rewards[_new].total == 0, "address already in use");

        rewards[_new] = rewards[_participant];
        delete rewards[_participant];

        emit LogChangeAddress(_participant, _new);
    }

    function setupDistribution(
        ERC20 _rewardToken,
        address[] calldata _participants,
        uint256[] calldata _totalRewards,
        uint256[] calldata _durations
    )
    external onlyOwner {
        require(!setupDone, "LinearDistribution already setup");
        require(_participants.length != 0, "there is no _participants");
        require(_participants.length == _totalRewards.length, "_participants count must match _rewards count");
        require(_participants.length == _durations.length, "_participants count must match _durations count");
        require(address(_rewardToken) != address(0x0), "empty _rewardToken");

        uint256 sum = 0;

        for (uint256 i = 0; i < _participants.length; i++) {
            require(_participants[i] != address(0x0), "empty participant");
            rewards[_participants[i]] = Reward(_totalRewards[i], _durations[i], 0);
            sum = sum.add(_totalRewards[i]);
        }

        rewardToken = _rewardToken;
        require(rewardToken.balanceOf(address(this)) >= sum, "not enough tokens for rewards");

        setupDone = true;

        emit LogSetup(sum, address(_rewardToken));
    }

    // ========== EVENTS ========== //

    event LogSetup(uint256 amount, address indexed rewardToken);
    event LogStart(uint256 startTime);
    event LogChangeAddress(address indexed from, address indexed to);
    event LogCancelDistribution(address indexed participant);
    event LogClaimed(address indexed recipient, uint256 amount);
}
