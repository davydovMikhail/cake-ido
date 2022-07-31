// SPDX-License-Identifier: MIT
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IWETH9.sol";

import "hardhat/console.sol";

contract Crepe {
    using SafeERC20 for IERC20Metadata;

    uint256 StartIn; // начало IDO
    uint256 EndIn; // конец IDO
    uint256 UnlockClaimTime; // время анлока на claimToken
    uint256 TotalAccumulated; // общее количество собранных USDC
    uint256 TotalCrepe; // общее количество Crepe Token, которые были внесены для последующего клейма

    ISwapRouter public immutable router;
    IWETH9 public immutable WETH;

    address USDC;
    address crepe;

    mapping(address => bool) public AcceptedTokenList;

    mapping(address => uint256) public Users;

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _unlockClaimTime,
        address _crepe,
        address _stableToken,
        address _router
    ) {
        StartIn = _startTime;
        EndIn = _endTime;
        UnlockClaimTime = _unlockClaimTime;
        crepe = _crepe;
        USDC = _stableToken;
        router = ISwapRouter(_router);
        address payable wethAddress = payable(router.WETH9());
        WETH = IWETH9(wethAddress);
        // uint256 currentTime = block.timestamp;
        // console.log(currentTime);
    }

    function joinToCampaign(
        address _acceptedToken,
        uint256 _amountIn,
        uint256 _amountOutMin
    ) external payable {
        require(
            block.timestamp > StartIn,
            "Campaign start time has not come yet."
        );
        require(block.timestamp < EndIn, "Campaign time has expired.");
        require(AcceptedTokenList[_acceptedToken], "Invalid payment token.");
        uint256 balanceBefore = IERC20Metadata(USDC).balanceOf(address(this));
        if (_acceptedToken == address(0)) {
            require(msg.value > 0, "You sent 0 MATIC");
            WETH.deposit{value: msg.value}();
            WETH.approve(address(router), msg.value);
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: address(WETH),
                    tokenOut: USDC,
                    fee: 3000, // pool fee 0.3%
                    recipient: address(this),
                    deadline: block.timestamp + 20,
                    amountIn: msg.value,
                    amountOutMinimum: _amountOutMin,
                    sqrtPriceLimitX96: 0
                });
            router.exactInputSingle(params);
        } else if (_acceptedToken == USDC) {
            // wbtc, weth
            IERC20Metadata(_acceptedToken).safeTransferFrom(
                msg.sender,
                address(this),
                _amountIn
            );
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
            router.exactInputSingle(params);
        }
        uint256 amountUSDC = IERC20Metadata(USDC).balanceOf(address(this)) -
            balanceBefore;
        Users[msg.sender] += amountUSDC;
        TotalAccumulated += amountUSDC;
    }

    function claimToken() external {
        require(
            block.timestamp > UnlockClaimTime,
            "The time of the unlock has not yet come"
        );
        require(Users[msg.sender] > 0, "Tokens claimed already");
        uint256 share = (Users[msg.sender] * TotalCrepe) / TotalAccumulated;
        IERC20Metadata(crepe).safeTransfer(msg.sender, share);
        Users[msg.sender] = 0; // убрать
    }

    function addAcceptedToken(address _newToken) external {
        AcceptedTokenList[_newToken] = !AcceptedTokenList[_newToken];
    }

    function approveCampaign(address _sender, address _amount) external {
        IERC20Metadata(crepe).safeTransferFrom(_sender, address(this), _amount);
        TotalCrepe += _amount;
    }
}
