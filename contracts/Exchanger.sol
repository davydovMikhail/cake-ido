// SPDX-License-Identifier: MIT
pragma solidity =0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Exchanger is AccessControl {
    using SafeERC20 for IERC20Metadata;  

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20Metadata public immutable Crepe; // The address of Crepe coin contract
    IERC20Metadata public immutable LKCrepe; // The address of LKCrepe coin contract
    address public immutable RemainsRecipient; // The remaining coins will be transferred to this address

    event Swaped(
        address User,
        uint Amount
    );

    constructor(address _crepe, address _lkCrepe, address _recipient) {
        Crepe = IERC20Metadata(_crepe);
        LKCrepe = IERC20Metadata(_lkCrepe);
        RemainsRecipient = _recipient;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Function for calling the exchange
     *
     * @param _amount The amount of LKCrepe coins to be exchanged for Crepe coins
     */
    function swap(uint256 _amount) external {
        require(_amount > 0, "The amount must be greater than zero.");
        LKCrepe.safeTransferFrom(msg.sender, address(this), _amount);
        Crepe.safeTransfer(msg.sender, _amount);
        emit Swaped(msg.sender, _amount);
    }

    /**
     * @dev Function for withdrawaling remains Crepe coins and LKCrepe coins to address RemainsRecipient
     */
    function withdrawal() external onlyRole(ADMIN_ROLE) {
        uint256 balanceCrepe = Crepe.balanceOf(address(this));
        uint256 balanceLKCrepe = LKCrepe.balanceOf(address(this));
        if (balanceCrepe > 0) {
            Crepe.safeTransfer(RemainsRecipient, balanceCrepe);
        }
        if (balanceLKCrepe > 0) {
            LKCrepe.safeTransfer(RemainsRecipient, balanceLKCrepe);
        }
    } 
}