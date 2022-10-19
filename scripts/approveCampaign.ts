import hre, { ethers } from "hardhat";
import { parseEther } from '@ethersproject/units';

async function main() {

    const sender = '';
    const amount = parseEther('14000000');
    const crepeTokenAddress = ''; 
     
    const contractCrepeToken = await hre.ethers.getContractAt("TokenERC20", crepeTokenAddress);
    const contractIDO = await hre.ethers.getContractAt("PresaleIDO", process.env.IDO_ADDR as string);

    await contractCrepeToken.approve(
        contractIDO.address, 
        amount
    );

    await contractIDO.approveCampaign(
        sender, 
        amount
    );
    
    console.log("Campaign approved");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });