//SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

// Inheritance
import "@openzeppelin/contracts/math/SafeMath.sol";

/// @title   Multi Signature base on Power
/// @author  umb.network
/// @notice  It's based on https://github.com/gnosis/MultiSigWallet but modified in a way to support power of vote.
///          It has option to assign power to owners, so we can have "super owner(s)".
abstract contract PowerMultiSig {
    using SafeMath for uint256;

    uint256 constant public MAX_OWNER_COUNT = 5;

    struct Transaction {
        address destination;
        uint256 value;
        uint256 executed;
        bytes data;
    }

    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(address => uint256) public ownersPowers;
    address[] public owners;

    uint256 public requiredPower;
    uint256 public totalCurrentPower;
    uint256 public transactionCount;

    // ========== MODIFIERS ========== //

    modifier onlyWallet() {
        require(msg.sender == address(this), "only MultiSigMinter can execute this");
        _;
    }

    modifier whenOwnerDoesNotExist(address _owner) {
        require(ownersPowers[_owner] == 0, "owner already exists");
        _;
    }

    modifier whenOwnerExists(address _owner) {
        require(ownersPowers[_owner] > 0, "owner do NOT exists");
        _;
    }

    modifier whenTransactionExists(uint256 _transactionId) {
        require(transactions[_transactionId].destination != address(0), "transaction does not exists");
        _;
    }

    modifier whenConfirmedBy(uint256 _transactionId, address _owner) {
        require(confirmations[_transactionId][_owner], "transaction NOT confirmed by owner");
        _;
    }

    modifier notConfirmedBy(uint256 _transactionId, address _owner) {
        require(!confirmations[_transactionId][_owner], "transaction already confirmed by owner");
        _;
    }

    modifier whenNotExecuted(uint256 _transactionId) {
        require(transactions[_transactionId].executed == 0, "transaction already executed");
        _;
    }

    modifier notNull(address _address) {
        require(_address != address(0), "address is empty");
        _;
    }

    modifier validRequirement(uint256 _totalOwnersCount, uint256 _totalPowerSum, uint256 _requiredPower) {
        require(_totalPowerSum >= _requiredPower, "owners do NOT have enough power");
        require(_totalOwnersCount <= MAX_OWNER_COUNT, "too many owners");
        require(_requiredPower != 0, "_requiredPower is zero");
        require(_totalOwnersCount != 0, "_totalOwnersCount is zero");
        _;
    }

    // ========== CONSTRUCTOR ========== //

    constructor(address[] memory _owners, uint256[] memory _powers, uint256 _requiredPower)
    validRequirement(_owners.length, sum(_powers), _requiredPower)
    {
        uint256 sumOfPowers = 0;

        for (uint256 i = 0; i < _owners.length; i++) {
            require(ownersPowers[_owners[i]] == 0, "owner already exists");
            require(_owners[i] != address(0), "owner is empty");
            require(_powers[i] != 0, "power is empty");

            ownersPowers[_owners[i]] = _powers[i];
            sumOfPowers = sumOfPowers.add(_powers[i]);
        }

        owners = _owners;
        requiredPower = _requiredPower;
        totalCurrentPower = sumOfPowers;
    }

    // ========== MODIFIERS ========== //

    function addOwner(address _owner, uint256 _power)
    public
    onlyWallet
    whenOwnerDoesNotExist(_owner)
    notNull(_owner)
    validRequirement(owners.length + 1, totalCurrentPower + _power, requiredPower)
    {
        require(_power != 0, "_power is empty");

        ownersPowers[_owner] = _power;
        owners.push(_owner);
        totalCurrentPower = totalCurrentPower.add(_power);

        emit LogOwnerAddition(_owner, _power);
    }

    function removeOwner(address _owner) public onlyWallet whenOwnerExists(_owner)
    {
        uint256 ownerPower = ownersPowers[_owner];
        require(
            totalCurrentPower - ownerPower >= requiredPower,
            "can't remove owner, because there will be not enough power left"
        );

        ownersPowers[_owner] = 0;
        totalCurrentPower = totalCurrentPower.sub(ownerPower);

        for (uint256 i = 0; i < owners.length - 1; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        }

        owners.pop();

        emit LogOwnerRemoval(_owner);
    }

    function replaceOwner(address _oldOwner, address _newOwner)
    public
    onlyWallet
    whenOwnerExists(_oldOwner)
    whenOwnerDoesNotExist(_newOwner)
    {
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _oldOwner) {
                owners[i] = _newOwner;
                break;
            }
        }

        uint256 power = ownersPowers[_oldOwner];
        ownersPowers[_newOwner] = power;
        ownersPowers[_oldOwner] = 0;

        emit LogOwnerRemoval(_oldOwner);
        emit LogOwnerAddition(_newOwner, power);
    }

    function changeRequiredPower(uint256 _newPower)
    public
    onlyWallet
    validRequirement(owners.length, totalCurrentPower, _newPower)
    {
        requiredPower = _newPower;
        emit LogPowerChange(_newPower);
    }

    function submitTransaction(address _destination, uint256 _value, bytes memory _data)
    public
    returns (uint256 transactionId)
    {
        transactionId = _addTransaction(_destination, _value, _data);
        confirmTransaction(transactionId);
    }

    function confirmTransaction(uint256 _transactionId)
    public
    whenOwnerExists(msg.sender)
    whenTransactionExists(_transactionId)
    notConfirmedBy(_transactionId, msg.sender)
    {
        confirmations[_transactionId][msg.sender] = true;
        emit LogConfirmation(msg.sender, _transactionId);
        executeTransaction(_transactionId);
    }

    /// @dev Allows an owner to revoke a confirmation for a transaction.
    /// @param _transactionId Transaction ID.
    function revokeLogConfirmation(uint256 _transactionId)
    public
    whenOwnerExists(msg.sender)
    whenConfirmedBy(_transactionId, msg.sender)
    whenNotExecuted(_transactionId)
    {
        confirmations[_transactionId][msg.sender] = false;
        emit LogRevocation(msg.sender, _transactionId);
    }

    /// @dev Allows anyone to execute a confirmed transaction.
    /// @param _transactionId Transaction ID.
    function executeTransaction(uint256 _transactionId)
    public
    whenOwnerExists(msg.sender)
    whenConfirmedBy(_transactionId, msg.sender)
    whenNotExecuted(_transactionId)
    {
        if (isConfirmed(_transactionId)) {
            Transaction storage txn = transactions[_transactionId];
            txn.executed = block.timestamp;

            (bool success, bytes memory data) = txn.destination.call(txn.data);

            require(success, string(abi.encodePacked("executeTransaction failed: ", string(data))));

            emit LogExecution(_transactionId);
        }
    }

    function _addTransaction(address _destination, uint256 _value, bytes memory _data)
    internal
    notNull(_destination)
    returns (uint256 transactionId)
    {
        transactionId = transactionCount;

        transactions[transactionId] = Transaction({
            destination : _destination,
            value : _value,
            data : _data,
            executed : 0
        });

        transactionCount += 1;
        emit LogSubmission(transactionId);
    }

    // ========== VIEWS ========== //

    function ownersCount() public view returns (uint256) {
        return owners.length;
    }

    function sum(uint256[] memory _numbers) public pure returns (uint256 total) {
        uint256 numbersCount = _numbers.length;

        for (uint256 i = 0; i < numbersCount; i++) {
            total += _numbers[i];
        }
    }

    function isConfirmed(uint256 _transactionId) public view returns (bool) {
        uint256 power = 0;

        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                power += ownersPowers[owners[i]];
            }

            if (power >= requiredPower) {
                return true;
            }
        }

        return false;
    }

    function isExceuted(uint256 _transactionId) public view returns (bool) {
        return transactions[_transactionId].executed != 0;
    }

    function getTransactionShort(uint256 _transactionId)
    public view returns (address destination, uint256 value, uint256 executed) {
        Transaction memory t = transactions[_transactionId];
        return (t.destination, t.value, t.executed);
    }

    function getTransaction(uint256 _transactionId)
    public view returns (address destination, uint256 value, uint256 executed, bytes memory data) {
        Transaction memory t = transactions[_transactionId];
        return (t.destination, t.value, t.executed, t.data);
    }

    /*
     * Web3 call functions
     */
    /// @dev Returns number of confirmations of a transaction.
    /// @param _transactionId Transaction ID.
    /// @return count Number of confirmations.
    function getLogConfirmationCount(uint256 _transactionId) public view returns (uint256 count)
    {
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                count += 1;
            }
        }
    }

    /// @dev Returns total number of transactions after filers are applied.
    /// @param _pending Include pending transactions.
    /// @param _executed Include executed transactions.
    /// @return count Total number of transactions after filters are applied.
    function getTransactionCount(bool _pending, bool _executed) public view returns (uint256 count)
    {
        for (uint256 i = 0; i < transactionCount; i++) {
            if (_pending && transactions[i].executed == 0 || _executed && transactions[i].executed != 0) {
                count += 1;
            }
        }
    }

    /// @dev Returns array with owner addresses, which confirmed transaction.
    /// @param _transactionId Transaction ID.
    /// @return _confirmations Returns array of owner addresses.
    function getLogConfirmations(uint256 _transactionId)
    public
    view
    returns (address[] memory _confirmations)
    {
        address[] memory confirmationsTemp = new address[](owners.length);
        uint256 count = 0;
        uint256 i;

        for (i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                confirmationsTemp[count] = owners[i];
                count += 1;
            }
        }

        _confirmations = new address[](count);

        for (i = 0; i < count; i++) {
            _confirmations[i] = confirmationsTemp[i];
        }
    }

    /// @dev Returns list of transaction IDs in defined range.
    /// @param _from Index start position of transaction array.
    /// @param _to Index end position of transaction array.
    /// @param _pending Include pending transactions.
    /// @param _executed Include executed transactions.
    /// @return _transactionIds Returns array of transaction IDs.
    function getTransactionIds(uint256 _from, uint256 _to, bool _pending, bool _executed)
    public
    view
    returns (uint256[] memory _transactionIds)
    {
        uint256[] memory transactionIdsTemp = new uint256[](_to - _from);
        uint256 count = 0;
        uint256 i;

        for (i = _from; i < _to; i++) {
            if (_pending && transactions[i].executed == 0 || _executed && transactions[i].executed != 0) {
                transactionIdsTemp[count] = i;
                count += 1;
            }
        }

        _transactionIds = new uint256[](count);

        for (i = 0; i < count; i++) {
            _transactionIds[i] = transactionIdsTemp[i];
        }
    }

    // ========== EVENTS ========== //

    event LogConfirmation(address indexed sender, uint256 indexed transactionId);
    event LogRevocation(address indexed sender, uint256 indexed transactionId);
    event LogSubmission(uint256 indexed transactionId);
    event LogExecution(uint256 indexed transactionId);
    event LogOwnerAddition(address indexed owner, uint256 power);
    event LogOwnerRemoval(address indexed owner);
    event LogPowerChange(uint256 power);
}
