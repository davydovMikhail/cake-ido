// SPDX-License-Identifier: MIT
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IWETH9.sol";

contract CrepeIDO is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;  

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CONTRACT_CONTROL_ROLE = keccak256("CONTRACT_CONTROL_ROLE");

    uint256 public immutable StartIn; // The time after which the user can participate in the IDO
    uint256 public immutable EndIn; // The time until which the user can participate in the IDO
    uint256 public immutable UnlockClaimTime; // The time after which the user can claim his share of Crepe tokens
    uint256 public immutable Goal; // IDO goal, if the goal is not achieved, then Crepe tokens will be distributed at a price from the MinPrice variable (below)
    uint256 public immutable MinPrice; // Minimum price of one Crepe token in USDC
    uint256 public TotalAccumulated; // The total amount of USD Coins collected
    uint256 public TotalCrepe; // The maximum amount of Crepe tokens that belong to the current contract to calculate the user's share

    ISwapRouter public immutable router; // Uniswap router for receiving USD Coins
    IWETH9 public immutable WETH; // The address of the wrapped MATIC to buy USD Coins for the native currency

    address public immutable USDC; // The address of the USD Coin contract
    address public immutable crepe; // Address of the Crepe Token contract

    // AcceptedTokenList[valid token] -> true/false
    mapping(address => bool) public AcceptedTokenList; // List of tokens for which you can participate

    // Users[user's address] -> USD Coin's amount from this address
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

    event AcceptedTokenChanged(
        address Token,
        bool Status
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
        address _stableCoin,
        address _router,
        uint256 _goal,
        uint256 _minPrice
    ) {
        StartIn = _startTime;
        EndIn = _endTime;
        UnlockClaimTime = _unlockClaimTime;
        crepe = _crepe;
        USDC = _stableCoin;
        router = ISwapRouter(_router);
        address payable wethAddress = payable(router.WETH9());
        WETH = IWETH9(wethAddress);
        Goal = _goal;
        MinPrice = _minPrice;
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
     * @param _amountOutMin Minimum allowable amount to be sent from Uniswap. The amount returned is affected by Price impact
     */
    function participate( 
        address _acceptedToken,
        uint256 _amountIn,
        uint256 _amountOutMin
    ) 
        external payable nonReentrant
    {
        require(
            block.timestamp > StartIn,
            "Campaign start time has not come yet."
        );
        require(block.timestamp < EndIn, "Campaign time has expired.");
        require(AcceptedTokenList[_acceptedToken], "Invalid payment token.");
        uint256 amountOut;
        if (_acceptedToken == address(0)) {
            require(msg.value > 0, "You sent 0 MATIC");
            WETH.deposit{value: msg.value}();
            require(WETH.approve(address(router), msg.value), "Approval WMATIC failed");
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: address(WETH),
                    tokenOut: USDC,
                    fee: 3000, // pool fee 0.3%
                    recipient: address(this),
                    deadline: block.timestamp + 60,
                    amountIn: msg.value,
                    amountOutMinimum: _amountOutMin,
                    sqrtPriceLimitX96: 0
                });
            amountOut = router.exactInputSingle(params); 
        } else if (_acceptedToken == USDC) {
            IERC20Metadata(_acceptedToken).safeTransferFrom(
                msg.sender,
                address(this),
                _amountIn
            );
            amountOut = _amountIn;
        } else {
            IERC20Metadata(_acceptedToken).safeTransferFrom(
                msg.sender,
                address(this),
                _amountIn
            );
            IERC20Metadata(_acceptedToken).safeApprove(
                address(router),
                _amountIn
            );
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: _acceptedToken,
                    tokenOut: USDC,
                    fee: 3000, // pool fee 0.3%
                    recipient: address(this),
                    deadline: block.timestamp + 20,
                    amountIn: _amountIn,
                    amountOutMinimum: _amountOutMin,
                    sqrtPriceLimitX96: 0
                });
            amountOut = router.exactInputSingle(params);
        }
        Users[msg.sender] += amountOut;
        TotalAccumulated += amountOut;
        emit Participated(amountOut, TotalAccumulated, _acceptedToken, msg.sender);
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
        uint256 share;
        if (TotalAccumulated >= Goal) {
            share = (Users[msg.sender] * TotalCrepe) / TotalAccumulated;
        } else {
            share = (Users[msg.sender] / MinPrice) * 10**18;
        }
        Users[msg.sender] = 0;
        IERC20Metadata(crepe).safeTransfer(msg.sender, share);
        emit Claimed(msg.sender, share);
    }

    /**
     * @dev Function for adding/removing tokens in which a user can make a payment
     *
     * @param _token Token to be added/removed
     */
    function changeAcceptedToken(address _token) external {
        require(hasRole(CONTRACT_CONTROL_ROLE, msg.sender), "You do not have access rights.");
        AcceptedTokenList[_token] = !AcceptedTokenList[_token];
        emit AcceptedTokenChanged(_token, AcceptedTokenList[_token]);
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
     * @dev Function for transferring collected USD Coins to the address _recipient after IDO
     *
     * @param _recipient Recipient of collected USD Coins
     */
    function finishCampaign(address _recipient) external {
        require(hasRole(CONTRACT_CONTROL_ROLE, msg.sender), "You do not have access rights.");
        require(block.timestamp > EndIn, "Fundraising is still ongoing.");
        uint256 thisUSDBalance = IERC20Metadata(USDC).balanceOf(address(this));
        IERC20Metadata(USDC).safeTransfer(_recipient, thisUSDBalance);
        uint256 actualCrepeRemaining;
        if (TotalAccumulated < Goal) {
            actualCrepeRemaining = (TotalCrepe * (Goal - TotalAccumulated)) / Goal;
            IERC20Metadata(crepe).safeTransfer(_recipient, actualCrepeRemaining);
        }
        emit CampaignFinished(_recipient, thisUSDBalance, actualCrepeRemaining);
    } 
}
