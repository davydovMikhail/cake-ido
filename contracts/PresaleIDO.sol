// SPDX-License-Identifier: MIT
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PresaleIDO is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;  

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CONTRACT_CONTROL_ROLE = keccak256("CONTRACT_CONTROL_ROLE");

    uint256 public immutable StartIn; // The time after which the user can participate in the IDO
    uint256 public immutable EndIn; // The time until which the user can participate in the IDO
    uint256 public immutable UnlockClaimTime; // The time after which the user can claim his share of Crepe tokens
    uint256 public immutable Goal; // After reaching this mark, IDO stops
    uint256 public immutable Price; // Price of one Crepe token in USD
    uint256 public TotalAccumulated; // The total amount of USD collected
    uint256 public TotalCrepe; // The maximum amount of Crepe tokens that belong to the current contract to calculate the user's share
    uint256 public TotalSold; // How much Crepe is reserved for claim

    address public immutable USDC; // The address of the USD Coin contract
    address public immutable USDT; // The address of the USD Tether contract
    address public immutable crepe; // Address of the Crepe Token contract
    address public immutable beneficiary; // Address where USD will be sent

    // Users[user's address] -> Crepe Coin's amount for claiming by this address
    mapping(address => uint256) public Users; 

    event Participated(
        uint AmountOut,
        uint TotalAccumulated,
        address AcceptedToken,
        address User
    );

    event Claimed(
        address User,
        uint CrepeAmount
    );

    event CampaignFinished(
        address Recipient,
        uint AmountUSDC,
        uint RemainingCrepe
    );

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _unlockClaimTime,
        address _crepe,
        address _usdc,
        address _usdt,
        uint256 _goal,
        uint256 _price,
        address _beneficiary
    ) {
        StartIn = _startTime;
        EndIn = _endTime;
        UnlockClaimTime = _unlockClaimTime;
        crepe = _crepe;
        USDC = _usdc;
        USDT = _usdt;
        Goal = _goal;
        Price = _price;
        beneficiary = _beneficiary;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(CONTRACT_CONTROL_ROLE, msg.sender);
        _setRoleAdmin(CONTRACT_CONTROL_ROLE, ADMIN_ROLE);
    }


    /**
     * @dev Function to participate in IDO
     *
     * @param _acceptedToken The token in which the payment for participation in IDO will take place
     * @param _amountIn The amount of _acceptedToken for participation in IDO
     */
    function participate( 
        address _acceptedToken,
        uint256 _amountIn
    ) 
        external nonReentrant
    {
        require(
            block.timestamp > StartIn,
            "Campaign start time has not come yet."
        );
        require(block.timestamp < EndIn, "Campaign time has expired.");
        require(_acceptedToken == USDC || _acceptedToken == USDT, "Invalid payment token.");
        IERC20Metadata(_acceptedToken).safeTransferFrom(
            msg.sender,
            address(this),
            _amountIn
        );
        uint256 crepeAmount = (_amountIn / Price) * 10**18;
        Users[msg.sender] += crepeAmount;
        TotalAccumulated += _amountIn;
        TotalSold += crepeAmount;
        require(TotalAccumulated <= Goal, "Decrease the amount in value.");
        emit Participated(_amountIn, TotalAccumulated, _acceptedToken, msg.sender);
    }

    /**
     * @dev Function to claim the user's share after completing the IDO
     */
    function claimToken() external {
        require(
            block.timestamp > UnlockClaimTime,
            "The time of the unlock has not yet come"
        );
        require(Users[msg.sender] > 0, "Nothing to claim.");
        uint256 share = Users[msg.sender];  
        Users[msg.sender] = 0;
        IERC20Metadata(crepe).safeTransfer(msg.sender, share);
        emit Claimed(msg.sender, share);
    }

    /**
     * @dev Function for transferring Crepe tokens to the current contract. It is necessary to record the total number of Crepe tokens on the contract
     *
     * @param _sender The address of the wallet from which Crepe tokens will be debited
     * @param _amount The amount of Crepe tokens to be debited from the _sender address
     */
    function approveCampaign(
        address _sender, 
        uint256 _amount
    ) 
        external 
    {
        require(hasRole(CONTRACT_CONTROL_ROLE, msg.sender), "You do not have access rights.");
        IERC20Metadata(crepe).safeTransferFrom(_sender, address(this), _amount);
        TotalCrepe += _amount;
    }

    /**
     * @dev Function for transferring collected USD Coins to the beneficiary address after IDO
     */
    function finishCampaign() external {
        require(hasRole(CONTRACT_CONTROL_ROLE, msg.sender), "You do not have access rights.");
        require(block.timestamp > EndIn, "Fundraising is still ongoing.");
        uint256 balanceUSDC = IERC20Metadata(USDC).balanceOf(address(this));
        uint256 balanceUSDT = IERC20Metadata(USDT).balanceOf(address(this));
        uint256 actualCrepeRemaining = TotalCrepe - TotalSold;
        if (balanceUSDC > 0) {
            IERC20Metadata(USDC).safeTransfer(beneficiary, balanceUSDC);
        }
        if (balanceUSDT > 0) {
            IERC20Metadata(USDT).safeTransfer(beneficiary, balanceUSDT);
        }
        if (actualCrepeRemaining > 0) {
            IERC20Metadata(crepe).safeTransfer(beneficiary, actualCrepeRemaining);
        }
        uint256 totalBalance = balanceUSDC + balanceUSDT;
        emit CampaignFinished(beneficiary, totalBalance, actualCrepeRemaining);
    } 
}
