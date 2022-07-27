// SPDX-License-Identifier: MIT
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/IUniswapRouter.sol";

contract Crepe {
    using SafeERC20 for IERC20Metadata;

    struct UserInfo {
        uint256 Accumulated; // Totaly accumulated amount to be paid out in Project token
        bool Received; // Currently paid out amount to the user in Project token
    }

    uint256 StartIn; // начало IDO
    uint256 EndIn; // конец IDO
    uint256 UnlockClaimTime; // время анлока на claimToken
    uint256 TotalAccumulated; // общее количество собранных USDC
    uint256 TotalCrepe; // общее количество Crepe Token, которые были внесены для последующего клейма

    IUniswapRouter router;
    address USDC;
    address crepe;

    mapping(address => bool) public AcceptedTokenList;

    mapping(address => UserInfo) public Users;

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _unlockClaimTime,
        address _crepe,
        address _stableToken
    ) {
        StartIn = _startTime;
        EndIn = _endTime;
        UnlockClaimTime = _unlockClaimTime;
        crepe = _crepe;
        USDC = _stableToken;
    }

    function joinToCampaign(address _acceptedToken, uint256 _amount)
        external
        payable
    {
        require(
            block.timestamp > StartIn,
            "Campaign start time has not come yet."
        );
        require(block.timestamp < EndIn, "Campaign time has expired.");
        uint256 balanceBefore = IERC20Metadata(USDC).balanceOf(address(this));
        if (_acceptedToken == address(0) && msg.value > 0) {
            // matic
            address[] memory path = new address[](2);
            path[0] = router.WETH();
            path[1] = USDC;
            router.swapExactETHForTokens{value: msg.value}(
                0,
                path,
                address(this),
                block.timestamp + 30
            );
        } else if (AcceptedTokenList[_acceptedToken]) {
            // wbtc, weth
            IERC20Metadata(_acceptedToken).safeTransferFrom(
                msg.sender,
                address(this),
                _amount
            );
            address[] memory path = new address[](2);
            path[0] = _acceptedToken;
            path[1] = USDC;
            router.swapExactTokensForTokens(
                _amount,
                0,
                path,
                address(this),
                block.timestamp + 30
            );
        } else if (_acceptedToken == USDC) {
            IERC20Metadata(_acceptedToken).safeTransferFrom(
                msg.sender,
                address(this),
                _amount
            );
        }
        uint256 amountUSDC = IERC20Metadata(USDC).balanceOf(address(this)) -
            balanceBefore;
        Users[msg.sender] = UserInfo({
            Accumulated: amountUSDC,
            Received: false
        });
        TotalAccumulated += amountUSDC;
    }

    function claimToken() external {
        require(
            block.timestamp > UnlockClaimTime,
            "The time of the unlock has not yet come"
        );
        require(!Users[msg.sender].Received, "Tokens claimed already");
        uint256 share = (Users[msg.sender].Accumulated * TotalCrepe) /
            TotalAccumulated;
        IERC20Metadata(crepe).safeTransfer(msg.sender, share);
        Users[msg.sender].Received = true;
    }

    function addAcceptedToken(address _newToken) external {
        AcceptedTokenList[_newToken] = !AcceptedTokenList[_newToken];
    }
}
