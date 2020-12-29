//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/BurnableToken.sol";
import "./interfaces/Owned.sol";

contract Auction is Owned {
  using SafeERC20 for BurnableToken;
  using SafeMath for uint;

  // ========== STATE VARIABLES ========== //

  uint public auctionEndsAt;
  uint public totalEthLocked = 0;
  uint minimalEthPricePerToken = 0;
  uint public totalUMBOnSale;
  uint public minimalRequiredLockedEth;
  uint public maximumLockedEth;

  BurnableToken public immutable UMB;

  mapping(address => uint) public balances;

  // ========== CONSTRUCTOR ========== //

  constructor(BurnableToken _umb, address _owner) Owned(_owner) {
    require(address(_umb) != address(0x0), "ump address is empty");

    UMB = _umb;
  }

  // ========== MODIFIERS ========== //

  modifier onlyBeforeAuction() {
    require(auctionEndsAt == 0, "The auction already started yet");

    _;
  }

  modifier whenAuctionInProgress() {
    require(auctionEndsAt > 0, "The auction has not started yet");
    require(!isAuctionOver(), "The auction has already ended");
    _;
  }

  modifier whenAuctionOver() {
    require(auctionEndsAt > 0, "The auction has not started yet");
    require(isAuctionOver(), "The auction is in progress");
    _;
  }

  // ========== INTERNALS ========== //

  function _max(uint _a, uint _b) internal pure returns (uint256) {
    if (_a < _b) return _b;

    return _a;
  }

  function _sendEth(address _receiver, uint256 _amount) private {
    (bool success,) = _receiver.call{value: _amount}("");
    require(success, "Transfer failed.");
  }

  // ========== VIEWS ========== //

  function tokenPrice() public view returns (uint256) {
    if (totalUMBOnSale == 0 || totalEthLocked == 0 || minimalEthPricePerToken == 0) {
      return 0;
    }

    return _max(totalEthLocked / totalUMBOnSale, minimalEthPricePerToken);
  }

  function centsToWeiPrice(uint256 _ethPriceInUsdCents, uint _targetTokenPriceInUsdCents) public pure returns (uint256) {
    return _targetTokenPriceInUsdCents.mul(10e18) / _ethPriceInUsdCents;
  }

  function umbFor(address _account) public view returns (uint256 ethBalance, uint256 umbShares) {
    ethBalance = balances[_account];

    if (ethBalance == 0) {
      return (ethBalance, umbShares);
    }

    umbShares = ethBalance.div(tokenPrice());
  }

  function wasAuctionSuccessful() public view returns (bool) {
    return totalEthLocked >= minimalRequiredLockedEth;
  }

  function isAuctionOver() public view returns (bool) {
    return block.timestamp >= auctionEndsAt || totalEthLocked >= maximumLockedEth;
  }

  function unsoldUMB() public view returns (uint256) {
    return totalUMBOnSale - totalEthLocked.div(tokenPrice());
  }

  // ========== MUTATIVE FUNCTIONS ========== //

  receive() external payable {
    require(auctionEndsAt > 0, "The auction has not started yet");
    require(auctionEndsAt >= block.timestamp, "The auction has already ended");

    totalEthLocked = totalEthLocked.add(msg.value);
    balances[msg.sender] = balances[msg.sender].add(msg.value);

    emit LogReceive(msg.sender, msg.value);
  }

  function withdraw() external whenAuctionInProgress {
    uint256 ethToWithdraw = balances[msg.sender];
    require(ethToWithdraw > 0, "you didn't lock any eth");

    balances[msg.sender] = 0;
    totalEthLocked = totalEthLocked.sub(ethToWithdraw);

    _sendEth(msg.sender, ethToWithdraw);

    emit LogWithdraw(msg.sender, ethToWithdraw);
  }

  function claim() external whenAuctionOver {
    (uint256 ethBalance, uint256 umbShares) = umbFor(msg.sender);
    balances[msg.sender] = 0;

    if (wasAuctionSuccessful()) {
      require(umbShares > 0, "you don't have any UMB");

      UMB.safeTransfer(msg.sender, umbShares);
    } else {
      require(ethBalance > 0, "you don't have any ETH");

      _sendEth(msg.sender, ethBalance);
    }

    emit LogClaim(msg.sender, ethBalance, umbShares);
  }

  // ========== RESTRICTED FUNCTIONS ========== //

  function setup(
    uint256 _minimalEthPricePerToken,
    uint256 _minimalRequiredLockedEth,
    uint256 _maximumLockedEth
  ) external onlyOwner onlyBeforeAuction {
    require(_minimalEthPricePerToken > 0, "_minimalEthPricePerToken is empty");
    require(_minimalRequiredLockedEth > 0, "_minimalRequiredLockedEth is empty");
    require(_maximumLockedEth > 0, "_maximumLockedEth is empty");

    minimalEthPricePerToken = _minimalEthPricePerToken;
    minimalRequiredLockedEth = _minimalRequiredLockedEth;
    maximumLockedEth = _maximumLockedEth;
  }

  // @TODO THIS IS ONLY FOR DEMO!!
  function stop() external {
    auctionEndsAt = block.timestamp;
  }

  function start() external onlyOwner {
    require(auctionEndsAt == 0, "you can start only once");

    uint _minimalEthPricePerToken = minimalEthPricePerToken;
    require(_minimalEthPricePerToken > 0, "minimalEthPricePerToken is not set");

    uint _minimalRequiredLockedEth = minimalRequiredLockedEth;
    require(minimalRequiredLockedEth > 0, "minimalRequiredLockedEth is not set");

    require(maximumLockedEth > 0, "maximumLockedEth is not set");

    auctionEndsAt = block.timestamp + 3 days;
    totalUMBOnSale = UMB.balanceOf(address(this));

    emit LogStart(auctionEndsAt, _minimalEthPricePerToken, _minimalRequiredLockedEth);
  }

  function withdrawETH() external onlyOwner whenAuctionOver {
    require(wasAuctionSuccessful(), "auction was NOT successful");

    _sendEth(payable(owner()), address(this).balance);
  }

  function withdrawUMB() external onlyOwner whenAuctionOver {
    require(!wasAuctionSuccessful(), "auction was successful, can't withdraw UMB, you can only burn it");

    UMB.safeTransfer(owner(), UMB.balanceOf(address(this)));
  }

  function burnUnsoldUMB() external onlyOwner whenAuctionOver {
    require(wasAuctionSuccessful(), "auction was not successful, you can only withdraw UMB");

    uint toBurn = unsoldUMB();
    require(toBurn  > 0, "all sold! nothing to burn");

    UMB.burn(toBurn);
  }

  // ========== EVENTS ========== //

  event LogStart(uint256 auctionEndsAt, uint256 minimalEthPricePerToken, uint256 minimalRequiredLockedEth);
  event LogWithdraw(address indexed account, uint256 amount);
  event LogClaim(address indexed account, uint ethBalance, uint umbAmount);
  event LogReceive(address indexed account, uint amount);
}
