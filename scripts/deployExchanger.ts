import hre, { ethers } from "hardhat";
import { parseEther } from '@ethersproject/units';

async function main() {

    const crepe = '';
    const lkcrepe = '';
    const remainingRecipient = '';
    
    console.log('Arguments for deploy: ', 
        crepe,
        lkcrepe,
        remainingRecipient
    );
    

    const Exchanger = await ethers.getContractFactory("Exchanger");
    const erc = await Exchanger.deploy(
        crepe,
        lkcrepe,
        remainingRecipient
    );
    await erc.deployed();
    console.log("Exchanger deployed to:", erc.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });