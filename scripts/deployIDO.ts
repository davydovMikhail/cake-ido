import hre, { ethers } from "hardhat";
// import { parseEther } from '@ethersproject/units';

async function main() {
    // const [owner] = await hre.ethers.getSigners();
    // console.log(owner.address);

    const startTime = 1659081423;
    const endTime = 1660550223;
    const unlockTimestamp = 1660550224;
    const crepeToken = '0x0000000000000000000000000000000000000000';
    const usdcToken = '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b';
    const router = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
    
    
    const IDO = await ethers.getContractFactory("Crepe");
    const ido = await IDO.deploy(
      startTime,
      endTime, 
      unlockTimestamp,
      crepeToken, 
      usdcToken,
      router
    );
    await ido.deployed();
    console.log("IDO deployed to:", ido.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });