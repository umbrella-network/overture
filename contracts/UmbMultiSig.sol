//SPDX-License-Identifier: MIT
pragma solidity >=0.7.5;

// import "hardhat/console.sol";

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/PowerMultiSig.sol";

/// @title   Umbrella MultiSig contract
/// @author  umb.network
/// @notice  This is extended version of PowerMultiSig wallet, that will allow to execute commands without FE.
/// @dev     Original MultiSig requires FE to run, but here, we have some predefined data for few transactions
///          so we can run it directly from Etherscan and not worry about data bytes
contract UmbMultiSig is PowerMultiSig {
  using SafeMath for uint;

  // ========== MODIFIERS ========== //

  // ========== CONSTRUCTOR ========== //

  constructor(address[] memory _owners, uint[] memory _powers, uint _requiredPower)
  PowerMultiSig(_owners, _powers, _requiredPower) {
  }

  // ========== MUTATIVE FUNCTIONS ========== //

  // @todo add some others helpers like this one, so we can easily manage wallet via Etherscan
  function submitUmbMintTransaction(address _destination, address _holder, uint _amount) public returns (uint) {
    bytes memory data = abi.encodePacked('@todo-set-predefined-bytes-for-call', 'and append vars', _holder, _amount);
    return submitTransaction(_destination, 0, data);
  }

  // ========== EVENTS ========== //
}
