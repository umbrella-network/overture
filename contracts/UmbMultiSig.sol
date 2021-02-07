//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// Inheritance
import "./interfaces/PowerMultiSig.sol";

/// @title   Umbrella MultiSig contract
/// @author  umb.network
/// @notice  This is extended version of PowerMultiSig wallet, that will allow to execute commands without FE.
/// @dev     Original MultiSig requires FE to run, but here, we have some predefined data for few transactions
///          so we can run it directly from Etherscan and not worry about data bytes
contract UmbMultiSig is PowerMultiSig {

    // ========== MODIFIERS ========== //

    // ========== CONSTRUCTOR ========== //

    constructor(address[] memory _owners, uint256[] memory _powers, uint256 _requiredPower)
    PowerMultiSig(_owners, _powers, _requiredPower) {
    }

    // ========== VIEWS ========== //

    function createFunctionSignature(string memory _f) public pure returns (bytes memory) {
        return abi.encodeWithSignature(_f);
    }

    // ========== MUTATIVE FUNCTIONS ========== //

    // ========== helpers for: MultiSig

    function submitAddOwner(address _owner, uint256 _power) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("addOwner(address,uint256)", _owner, _power);
        return submitTransaction(address(this), 0, data);
    }

    function submitRemoveOwner(address _owner) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("removeOwner(address)", _owner);
        return submitTransaction(address(this), 0, data);
    }

    function submitReplaceOwner(address _old, address _new) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("replaceOwner(address,address)", _old, _new);
        return submitTransaction(address(this), 0, data);
    }

    function submitChangeRequiredPower(uint256 _power) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("changeRequiredPower(uint256)", _power);
        return submitTransaction(address(this), 0, data);
    }

    // ========== helpers for: UMB, rUMB

    function submitTokenMintTx(address _destination, address _holder, uint _amount) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("mint(address,uint256)", _holder, _amount);
        return submitTransaction(_destination, 0, data);
    }

    // ========== helpers for: UMB

    function submitUMBSetRewardTokensTx(
        address _destination,
        address[] memory _tokens,
        bool[] calldata _statuses
    ) external returns (uint) {
        bytes memory data = abi.encodeWithSignature("setRewardTokens(address[],bool[])", _tokens, _statuses);
        return submitTransaction(_destination, 0, data);
    }

    // ========== helpers for: rUMB

    function submitRUMBStartEarlySwapTx(address _destination) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("startEarlySwap()");
        return submitTransaction(_destination, 0, data);
    }

    // ========== helpers for: Rewards

    function submitRewardsSetupDistributionTx(
        address _destination,
        address _rewardToken,
        address[] calldata _participants,
        uint256[] calldata _rewards,
        uint256[] calldata _durations,
        uint8[] calldata _bulks
    ) public returns (uint) {
        bytes memory data = abi.encodeWithSignature(
            "setupDistribution(address,address[],uint256[],uint256[],uint8[])",
            _rewardToken,
            _participants,
            _rewards,
            _durations,
            _bulks
        );

        return submitTransaction(_destination, 0, data);
    }

    function submitRewardsStartTx(address _destination) public returns (uint) {
        return submitTransaction(_destination, 0, abi.encodeWithSignature("start()"));
    }

    // ========== helpers for: StakingRewards

    function submitStakingRewardsSetRewardsDistributionTx(
        address _destination,
        address _rewardsDistributor
    ) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("setRewardsDistribution(address)", _rewardsDistributor);
        return submitTransaction(_destination, 0, data);
    }

    function submitStakingRewardsSetRewardsDurationTx(address _destination, uint _duration) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("setRewardsDuration(uint256)", _duration);
        return submitTransaction(_destination, 0, data);
    }

    function submitStakingRewardsNotifyRewardAmountTx(address _destination, uint _amount) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("notifyRewardAmount(uint256)", _amount);
        return submitTransaction(_destination, 0, data);
    }

    function submitStakingRewardsFinishFarmingTx(address _destination) public returns (uint) {
        bytes memory data = abi.encodeWithSignature("finishFarming()");
        return submitTransaction(_destination, 0, data);
    }

    // ========== EVENTS ========== //
}
