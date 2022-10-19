// SPDX-License-Identifier: MIT
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CrepeVesting is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CONTRACT_CONTROL_ROLE = keccak256("CONTRACT_CONTROL_ROLE");

    // Information about some vesting
    struct Vesting {
        uint startTime; // Vesting start time
        uint duration; // Duration of vesting
        address vestingToken; // The token that is distributed during the vesting
        uint totalPaidOut; // The total amount that was paid to the participants of the vesting
        string name; // Vesting name for the frontend side
    }

    // Information about some user
    struct User {
        uint promisedAmount; // The promised amount to the vesting participant
        uint paidOut; // The amount already paid to the vesting participant
    }

    // users[vestingID][user's address] -> information about some user in current vesting
    mapping(uint => mapping(address => User)) public users;

    // vestings[vestingID] -> information about some vesting
    Vesting[] public vestings; // Array with all vestings

    event VestingCreated(
        uint StartTime,
        uint Duration,
        address Token,
        uint VestingID
    );

    event TokenClaimed(
        uint WhitelistAmount,
        uint CurrentClaimAmount,
        uint UserTotalClaim,
        uint TotalPaidOut,
        uint VestingID,
        address User
    );

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(CONTRACT_CONTROL_ROLE, msg.sender);
        _setRoleAdmin(CONTRACT_CONTROL_ROLE, ADMIN_ROLE);
    }

    /**
     * @dev Function for creating a new vesting
     *
     * @param _startTime The start time of the distribution of funds among users
     * @param _duration Duration of time for uniform distribution of funds
     * @param _token The address of the token that will be distributed among users
     * @param _name Vesting name for the frontend side
     */
    function createNewVesting(
        uint _startTime, 
        uint _duration, 
        address _token, 
        string calldata _name
    ) 
        external returns (uint vestingID) 
    {
        require(hasRole(CONTRACT_CONTROL_ROLE, msg.sender), "You do not have access rights.");
        require(
            block.timestamp < _startTime,
            "The start vesting time must be in the future."
        );
        require(
            _token != address(0),
            "Token address must be defined."
        );

        vestings.push(
            Vesting({
                startTime: _startTime,
                duration: _duration,
                vestingToken: _token,
                totalPaidOut: 0,
                name: _name
            })
        );
        vestingID = vestings.length - 1;
        emit VestingCreated(
            _startTime, 
            _duration, 
            _token, 
            vestingID
        );
    }

    /**
     * @dev Function for adding users who can participate in the distribution of funds
     *
     * @param _vestingID Vesting's unique identifier
     * @param _users Array of wallets participating in the vesting
     * @param _amounts The amounts that will be received by wallets from the _users array during the distribution of funds
     */
    function addUsersToWhitelist(
        uint _vestingID, 
        address[] memory _users, 
        uint[] memory _amounts
    ) 
        external 
    {
        require(hasRole(CONTRACT_CONTROL_ROLE, msg.sender), "You do not have access rights.");
        require(_vestingID < vestings.length, "ID does not exist.");
        require(_users.length == _amounts.length, "The number of addresses must be equal to the number of amounts.");
        for (uint i = 0; i < _users.length; i++) {
            users[_vestingID][_users[i]].promisedAmount = _amounts[i];
        }
    }

    /**
     * @dev Function for debiting funds by the user
     *
     * @param _vestingID The unique identifier of the vesting in which the user participates
     */
    function claim(uint _vestingID) external nonReentrant {
        require(_vestingID < vestings.length, "ID does not exist.");
        Vesting storage vesting = vestings[_vestingID];
        User storage user = users[_vestingID][msg.sender];
        require(user.promisedAmount > 0, "Sender must be whitelisted.");
        require(
            block.timestamp > vesting.startTime,
            "Vesting start time has not come yet."
        );
        uint amount;
        if (block.timestamp > vesting.startTime + vesting.duration) {
            amount = user.promisedAmount;
        } else {
            amount = ((block.timestamp - vesting.startTime) * user.promisedAmount) / vesting.duration;
        }
        amount -= user.paidOut;
        user.paidOut += amount;
        vesting.totalPaidOut += amount;
        require(amount > 0, "Nothing to claim.");
        IERC20Metadata(vesting.vestingToken).safeTransfer(
            msg.sender,
            amount
        );
        emit TokenClaimed(
            user.promisedAmount, 
            amount, 
            user.paidOut, 
            vesting.totalPaidOut, 
            _vestingID,
            msg.sender
        );
    }

    /**
     * @dev Function that returns the unique identifier of the last created vesting
     */
    function getLastIdentifier() external view returns (uint) {
        return vestings.length == 0 ? 500 : vestings.length - 1;
    }
}