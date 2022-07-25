// SPDX-License-Identifier: MIT
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

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


    mapping(address => bool) public AcceptedTokenList;

    mapping(address => UserInfo) public users;

    function joinToCampaign(address _acceptedToken, uint256 _amount) external {
        require(
            block.timestamp > StartIn,
            "Campaign start time has not come yet."
        );
        require(block.timestamp < EndIn, "Campaign time has expired.");

        if(_acceptedToken == 0 && msg.value > 0) {

        } else if(AcceptedTokenList[_acceptedToken]) {

        }
    }

    // function claimToken() external {

    // }
}