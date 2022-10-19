
const { task } = require("hardhat/config");

task("changeAcceptToken", "adding some tokens for accept")
    .addParam("token", "new accepted token")
    .setAction(async function (taskArgs: any, hre: any) {
        const contract = await hre.ethers.getContractAt("CrepeIDO", process.env.IDO_ADDR);
        try {
            await contract.changeAcceptedToken(taskArgs.token);
            console.log(`New accepted token added: ${taskArgs.token}`);
        } catch (e) {
            console.log('error',e)
        }
    });