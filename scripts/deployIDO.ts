import hre, { ethers } from "hardhat";

async function main() {

    const startTime = Number(process.env.START_TIME_IDO);
    const endTime = Number(process.env.END_TIME_IDO);
    const unlockTimestamp = Number(process.env.UNLOCK_TIME_IDO);
    const crepeToken = process.env.CREPE_TOKEN_ADDR as string;
    const usdcToken = process.env.USDC_TOKEN_ADDR as string;
    const router = process.env.ROUTER_ADDR as string;
    const goal = Number(process.env.IDO_GOAL);
    const minPrice = Number(process.env.MIN_PRICE);

    const usdcContract = await ethers.getContractAt("TokenERC20", usdcToken);
    const decimals = await usdcContract.decimals();
    const goalDec = goal * 10 ** decimals;
    const minPriceDec = minPrice * 10 ** decimals;

    console.log("Deploy arguments:", 
        startTime,
        endTime, 
        unlockTimestamp,
        crepeToken, 
        usdcToken,
        router,
        goalDec,
        minPriceDec
    );
        
    const IDO = await ethers.getContractFactory("CrepeIDO");
    const ido = await IDO.deploy(
      startTime,
      endTime, 
      unlockTimestamp,
      crepeToken, 
      usdcToken,
      router,
      goalDec,
      minPriceDec
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