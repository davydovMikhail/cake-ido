import hre, { ethers } from "hardhat";

async function main() {
    
    const Vesting = await ethers.getContractFactory("CrepeVesting");
    const vesting = await Vesting.deploy();
    await vesting.deployed();
    console.log("Vesting deployed to:", vesting.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });