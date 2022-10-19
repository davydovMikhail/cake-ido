import hre, { ethers } from "hardhat";
import { parseEther } from '@ethersproject/units';

async function main() {

    const name = "";
    const symbol = "";
    const totalSupply = parseEther('100000000000');
    
    
    const ERC = await ethers.getContractFactory("TokenERC20");
    const erc = await ERC.deploy(
      name,
      symbol, 
      totalSupply
    );
    await erc.deployed();
    console.log("Token deployed to:", erc.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });