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

    uint256 StartIn; 
    uint256 EndIn;
    uint256 TokenRate;
    uint256 PaidOut;

    IUniswapRouter router;
    address USDC;
    address crepe;


    mapping(address => bool) public AcceptedTokenList;

    mapping(address => UserInfo) public users;

    function getRate(uint256 _USDCBalance) internal view returns (uint256 rate) {
        uint256 crepeBalance = IERC20Metadata(crepe).balanceOf(address(this));
        rate = _USDCBalance / crepeBalance;
    }

    function joinToCampaign(address _acceptedToken, uint256 _amount) external payable {
        require(
            block.timestamp > StartIn,
            "Campaign start time has not come yet."
        );

        require(block.timestamp < EndIn, "Campaign time has expired.");
        uint256 balanceBefore = IERC20Metadata(USDC).balanceOf(address(this));
        uint256 rate = getRate(balanceBefore);
        if(_acceptedToken == address(0) && msg.value > 0) { // matic
            address[] memory path = new address[](2);
            path[0] = router.WETH();
            path[1] = USDC;
            router.swapExactETHForTokens{ value: msg.value }(
                0,
                path,
                address(this),
                block.timestamp + 30
            );
        } else if(AcceptedTokenList[_acceptedToken]) { // wbtc, weth
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
        } else if(_acceptedToken == USDC) {
            IERC20Metadata(_acceptedToken).safeTransferFrom(
                msg.sender,
                address(this),
                _amount
            );
        }
        uint256 amountUSDC = IERC20Metadata(USDC).balanceOf(address(this)) - balanceBefore;
        uint256 amountToReceive = amountUSDC / rate;
        users[msg.sender] = UserInfo({
            Accumulated: amountToReceive, 
            Received: false
        });
    }

    // function claimToken() external {

    // }
}