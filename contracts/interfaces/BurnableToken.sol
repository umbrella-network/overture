//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// Inheritance
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract BurnableToken is ERC20 {
  function burn(uint256 _amount) external {
    uint balance = balanceOf(msg.sender);
    require(_amount <= balance, "not enough tokens to burn");

    _burn(msg.sender, balance);
  }
}
