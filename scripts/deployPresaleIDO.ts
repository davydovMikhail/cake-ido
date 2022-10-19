import hre, { ethers } from "hardhat";

async function main() {

    const startTime = Number(process.env.START_TIME_IDO);
    const endTime = Number(process.env.END_TIME_IDO);
    const unlockTimestamp = Number(process.env.UNLOCK_TIME_IDO);
    const crepeToken = process.env.CREPE_TOKEN_ADDR as string;
    const usdcToken = process.env.USDC_TOKEN_ADDR as string;
    const usdtToken = process.env.USDT_TOKEN_ADDR as string;
    const goal = Number(process.env.PRESALE_IDO_GOAL);
    const minPrice = Number(process.env.MIN_PRICE);
    const beneficiary = process.env.BENEFICIARY as string;

    const usdcContract = await ethers.getContractAt("TokenERC20", usdcToken);
    const usdtContract = await ethers.getContractAt("TokenERC20", usdtToken);

    const decimalsUSDC = await usdcContract.decimals();
    const decimalsUSDT = await usdtContract.decimals();

    console.log("Decimals is the same - ", decimalsUSDC === decimalsUSDT);

    const goalDec = goal * 10 ** decimalsUSDC;
    const minPriceDec = minPrice * 10 ** decimalsUSDC;

    console.log("Deploy arguments:", 
        startTime,
        endTime, 
        unlockTimestamp,
        crepeToken, 
        usdcToken,
        usdtToken,
        goalDec,
        minPriceDec
    );
        
    const IDO = await ethers.getContractFactory("PresaleIDO");
    const ido = await IDO.deploy(
      startTime,
      endTime, 
      unlockTimestamp,
      crepeToken, 
      usdcToken,
      usdtToken,
      goalDec,
      minPriceDec,
      beneficiary
    );
    await ido.deployed();
    console.log("Presale IDO deployed to:", ido.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });