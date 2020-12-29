//SPDX-License-Identifier: MIT
pragma solidity >=0.7.5;

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

  // for mintable tokens
  function submitTokenMintTx(address _destination, address _holder, uint _amount) public returns (uint) {
    bytes memory data = abi.encodeWithSignature("mint(address,uint256)", _holder, _amount);
    return submitTransaction(_destination, 0, data);
  }

  // for UMB token
  function submitSetRewardTokensTx(address _destination, address[] memory _tokens, bool[] memory _statuses) public returns (uint) {
    bytes memory data = abi.encodeWithSignature("setRewardTokens(address[],bool[])", _tokens, _statuses);
    return submitTransaction(_destination, 0, data);
  }

  // for rUMB
  function submitStartSwapNowTx(address _destination) public returns (uint) {
    bytes memory data = abi.encodeWithSignature("startSwapNow()");
    return submitTransaction(_destination, 0, data);
  }

  // for StakingRewards
  function submitSetRewardsDistributionTx(address _destination, address _rewardsDistributor) public returns (uint) {
    bytes memory data = abi.encodeWithSignature("setRewardsDistribution(address)", _rewardsDistributor);
    return submitTransaction(_destination, 0, data);
  }

  // for StakingRewards
  function submitSetRewardsDistributionTx(address _destination, uint _duration) public returns (uint) {
    bytes memory data = abi.encodeWithSignature("setRewardsDuration(uint256)", _duration);
    return submitTransaction(_destination, 0, data);
  }

  // for StakingRewards
  function submitSetRewardsDurationTx(address _destination, uint _duration) public returns (uint) {
    bytes memory data = abi.encodeWithSignature("setRewardsDuration(uint256)", _duration);
    return submitTransaction(_destination, 0, data);
  }

  // for StakingRewards
  function submitNotifyRewardAmountTx(address _destination, uint _amount) public returns (uint) {
    bytes memory data = abi.encodeWithSignature("notifyRewardAmount(uint256)", _amount);
    return submitTransaction(_destination, 0, data);
  }

  // ========== EVENTS ========== //
}
