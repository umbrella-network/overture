//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";

import "../interfaces/Owned.sol";
import "../interfaces/IBurnableToken.sol";

/// @title   Umbrella Airdrop contract
/// @author  umb.network
/// @notice  This contract allows to provide scalable airdrops
/// @dev     Can be use used with MultiSig as owner
contract UMBAirdrop is Owned {
    bytes constant ETH_PREFIX = "\x19Ethereum Signed Message:\n32";

    // ========== STATE VARIABLES ========== //

    IERC20 public airdropToken;

    mapping(uint256 => mapping(address => bool)) paid;

    struct Airdrop {
        bytes32 merkleRoot;
        uint256 amount;
    }

    Airdrop[] public airdrops;

    constructor(
        address _owner,
        address _airdropToken
    ) Owned(_owner) {
        airdropToken = IERC20(_airdropToken);
    }

    function receiveAirdrop(uint256 _airdropIndex, bytes32[] calldata _proof)
    external
    onlyOwner() {
        Airdrop memory airdrop = airdrops[_airdropIndex];

        require(MerkleProof.verify(_proof, airdrop.merkleRoot, keccak256(abi.encodePacked(msg.sender))), "msg.sender should belong to the airdrop");

        airdropToken.transfer(msg.sender, airdrop.amount);

        paid[_airdropIndex][msg.sender] = true;

        emit AirDropped(msg.sender, airdrop.amount);
    }

    function registerAirdrop(bytes32 _merkleRoot, uint256 _amount)
    external
    onlyOwner() {
        require(_amount > 0, "zero amount");

        Airdrop memory airdrop = Airdrop(_merkleRoot, _amount);
        airdrops.push(airdrop);
    }

    function executeDirectAirdrop(address[] calldata _recipients, uint256 _amount)
    external
    onlyOwner() {
        require(_amount > 0, "zero amount");

        for (uint256 index = 0; index < _recipients.length; index++) {
            airdropToken.transfer(_recipients[index], _amount);
        }

        emit AirDroppedMulti(_recipients, _amount);
    }

    event AirDroppedMulti(
        address[] _recipients,
        uint256 _amount);

    event AirDropped(
        address _recipient,
        uint256 _amount);
}
