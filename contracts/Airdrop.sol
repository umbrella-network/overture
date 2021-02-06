//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// Inheritance
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/Owned.sol";

/// @title   Umbrella Airdrop contract
/// @author  umb.network
/// @notice  This contract provides Airdrop capability.
contract Airdrop is Owned {
    //using SafeERC20 for ERC20;
    constructor(address _owner) Owned(_owner) {
    }

    function airdropTokens(
        ERC20 _rewardToken,
        address[] calldata _addresses,
        uint256[] calldata _amounts
    )
    external onlyOwner {
        require(_addresses.length != 0, "there are no _addresses");
        require(_addresses.length == _amounts.length, "the number of _addresses should match _amounts");

        for(uint i = 0; i < _addresses.length; i++) {
            _rewardToken.transfer(_addresses[i], _amounts[i]);
        }
    }
}
