//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// import "@nomiclabs/buidler/console.sol";

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AuctionDummyToken is ERC20 {
    using SafeMath for uint256;

    /* ========== STATE VARIABLES ========== */

    address public minter;

    /* ========== CONSTRUCTOR ========== */

    constructor () ERC20("AuctionDummyToken", "ADT") {
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function burn(uint256 _amount) external {
        _burn(_msgSender(), _amount);
    }

    /* ========== PRIVATE / INTERNAL ========== */

    function mint(address _holder, uint256 _amount) external {
        require(_amount > 0, "_amount is empty");
        _mint(_holder, _amount);
    }
}
