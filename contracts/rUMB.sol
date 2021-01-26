//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "./lib/Strings.sol";

// Inheritance
import "./interfaces/SwappableToken.sol";
import "./interfaces/MintableToken.sol";


/// @title   Umbrella Rewards contract
/// @author  umb.network
/// @notice  This is reward UMB token (rUMB)
/// @dev     Rewards tokens are used for farming and other rewards distributions.
contract rUMB is MintableToken, SwappableToken {
    using Strings for string;

    // ========== STATE VARIABLES ========== //

    // ========== CONSTRUCTOR ========== //

    constructor (
        address _multiSig,
        address _initialHolder,
        uint256 _initialBalance,
        uint256 _maxAllowedTotalSupply,
        uint256 _rewardId,
        uint256 _swapDuration,
        string memory _name,
        string memory _symbol
    )
    Owned(_multiSig)
    ERC20(
        _name.appendString(" Reward Token #").appendNumber(_rewardId),
        string("r").appendString(_symbol).appendNumber(_rewardId)
    )
    MintableToken(_maxAllowedTotalSupply)
    SwappableToken(_maxAllowedTotalSupply, _swapDuration) {
        if (_initialHolder != address(0) && _initialBalance != 0) {
            _mint(_initialHolder, _initialBalance);
        }
    }

    // ========== MODIFIERS ========== //

    // ========== MUTATIVE FUNCTIONS ========== //

    // ========== PRIVATE / INTERNAL ========== //

    // ========== RESTRICTED FUNCTIONS ========== //

    // ========== EVENTS ========== //
}
