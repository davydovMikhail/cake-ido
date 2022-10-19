const { task } = require("hardhat/config");
import { parseEther } from '@ethersproject/units';

task("participate", "user task")
    .addParam("token", "accepted token")
    .addParam("amountin", "quantity of currency")
    .setAction(async function (taskArgs: any, hre: any) {
        const contract = await hre.ethers.getContractAt("CrepeIDO", process.env.IDO_ADDR);
        const erc20 = await hre.ethers.getContractAt("IERC20Metadata", taskArgs.token);
        try {
            await erc20.approve(contract.address, taskArgs.amountin)
            await contract.participate(taskArgs.token, taskArgs.amountin, 0, { value: taskArgs.amountin });
            console.log('Done. Joined.');
        } catch (e) {
            console.log('error',e)
        }
    });