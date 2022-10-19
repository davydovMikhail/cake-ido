pragma solidity >=0.4.0;

interface IWETH9 {
    receive() external payable;

    function deposit() external payable;

    function approve(address guy, uint wad) external returns (bool);
}