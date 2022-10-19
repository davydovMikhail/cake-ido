// const { task } = require("hardhat/config");

task("grantRole", "Grant role for contract controller")
    .addParam("address", "controller's address")
    .setAction(async function (taskArgs: any, hre: any) {
        const contract = await hre.ethers.getContractAt("Distribution", process.env.VESTING_ADDR);
        try {
            const CONTRACT_CONTROL_ROLE = await contract.CONTRACT_CONTROL_ROLE();
            await contract.grantRole(CONTRACT_CONTROL_ROLE, taskArgs.address);
            console.log(`New address for CONTRACT_CONTROL_ROLE: ${taskArgs.address}`);
        } catch (e) {
            console.log('error',e)
        }
    });