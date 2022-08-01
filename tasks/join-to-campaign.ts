const { task } = require("hardhat/config");
import { parseEther } from '@ethersproject/units';

task("joinToCampaign", "user task")
    .addParam("token", "accepted token")
    .addParam("amountin", "quantity of currency")
    .setAction(async function (taskArgs: any, hre: any) {
        const contract = await hre.ethers.getContractAt("Crepe", process.env.IDO_ADDR);
        try {
            const amount = parseEther(taskArgs.amountin.toString());
            const tx = await contract.joinToCampaign(taskArgs.token, amount, parseEther('0'), { value: amount });
            await tx.wait();
            console.log(tx);
            console.log('Done. Joined.');
        } catch (e) {
            console.log('error',e)
        }
    });