import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import * as mocha from "mocha-steps";
import { parseEther } from '@ethersproject/units';
import { CrepeVesting, ERC20 } from '../typechain-types';

describe("", async () => {
    let vesting: CrepeVesting;
    let admin: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let user4: SignerWithAddress;
    let user5: SignerWithAddress;
    let user6: SignerWithAddress;
    let user7: SignerWithAddress;
    let user8: SignerWithAddress;
    let controller: SignerWithAddress;
    let token1: ERC20;
    let token2: ERC20;

    const nullAddress = '0x0000000000000000000000000000000000000000';
    const delta = 100000000000000000n; // 1e17
    let currentID: BigNumber;

    beforeEach(async () => {
        [admin, user1, user2, user3, user4, user5, user6, user7, user8, controller] = await ethers.getSigners();
    });

    async function getCurrentTime() {
        let blockNumber = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNumber);
        return block.timestamp;
    }

    mocha.step("STEP1. Deploy Vesting", async function () {
        const Vesting = await ethers.getContractFactory("CrepeVesting");
        vesting = await Vesting.connect(admin).deploy();
    });
   
    mocha.step("STEP2. Deploy some tokens", async function () {
        const ERC20F = await ethers.getContractFactory("TokenERC20");
        const initialSupply = parseEther('1000000')
        token1 = await ERC20F.connect(admin).deploy('Token 1', 'TKN1', initialSupply);
        token2 = await ERC20F.connect(admin).deploy('Token 2', 'TKN2', initialSupply);
    });

    mocha.step("STEP3. Checking access control for ADMIN_ROLE", async function () {
        await expect(vesting.connect(user8).grantRole((await vesting.CONTRACT_CONTROL_ROLE()), controller.address)).to.be.revertedWith(`AccessControl: account ${user8.address.toLowerCase()} is missing role ${(await vesting.ADMIN_ROLE()).toLowerCase()}`);
    });

    mocha.step("STEP4. Grant role for contract controller", async function () {
        await vesting.connect(admin).grantRole((await vesting.CONTRACT_CONTROL_ROLE()), controller.address);
    });

    mocha.step("STEP5. Check last identifier without campaigns", async function () {
        currentID = await vesting.getLastIdentifier();
        expect(await vesting.getLastIdentifier()).eq(500);
    });

    mocha.step("STEP6. Start First Vesting", async function () {
        const currentTime = await getCurrentTime();
        const startTime = currentTime + 1000;
        const duration = 3600 * 24 * 60; // 60 days
        const name = 'First Vesting';
        await vesting.connect(controller).createNewVesting(
            startTime, 
            duration, 
            token1.address,
            name
        );   
    });

    mocha.step("STEP7. Checking requires for createNewVesting", async function () {
        const currentTime = await getCurrentTime();
        const startTime = currentTime + 1000;
        const duration = 3600 * 24 * 60; // 60 days
        const name = 'First Vesting';
        await expect(vesting.connect(admin).createNewVesting(
            currentTime - 1, 
            duration, 
            token1.address,
            name 
        )).to.be.revertedWith('The start vesting time must be in the future.');
        await expect(vesting.connect(admin).createNewVesting(
            startTime, 
            duration, 
            nullAddress,
            name 
        )).to.be.revertedWith('Token address must be defined.');
        await expect(vesting.connect(user1).createNewVesting(
            startTime, 
            duration, 
            token1.address,
            name 
        )).to.be.revertedWith("You do not have access rights.");
    });

    mocha.step("STEP8. Adding users to whitelist for first campaign", async function () {
        currentID = await vesting.getLastIdentifier();
        const usersArray = [
            user1.address,
            user2.address,
            user3.address,
            user4.address,
            user5.address
        ];
        const amountsArray = [ // total = 22000
            parseEther('1000'),
            parseEther('4000'),
            parseEther('5500'),
            parseEther('8500'),
            parseEther('3000')
        ];
        await expect(vesting.connect(user1).addUsersToWhitelist(currentID, usersArray, amountsArray)).to.be.revertedWith("You do not have access rights.");
        await expect(vesting.connect(controller).addUsersToWhitelist(10, usersArray, amountsArray)).to.be.revertedWith('ID does not exist.');
        await expect(vesting.connect(controller).addUsersToWhitelist(
            currentID, usersArray, [
                parseEther('1000'),
                parseEther('4000'),
                parseEther('5500')
            ]
        )).to.be.revertedWith('The number of addresses must be equal to the number of amounts.');
        await vesting.connect(controller).addUsersToWhitelist(currentID, usersArray, amountsArray);
    });

    mocha.step("STEP9. Checking requires for addUsersToWhitelist", async function () {
        const usersArray = [
            user1.address,
            user2.address,
            user3.address,
            user4.address,
            user5.address
        ];
        const amountsArray = [ // total = 22000
            parseEther('1000'),
            parseEther('4000'),
            parseEther('5500'),
            parseEther('8500'),
            parseEther('3000')
        ];
        await expect(vesting.connect(user1).addUsersToWhitelist(currentID, usersArray, amountsArray)).to.be.revertedWith("You do not have access rights.");
        await expect(vesting.connect(controller).addUsersToWhitelist(10, usersArray, amountsArray)).to.be.revertedWith('ID does not exist.');
        await expect(vesting.connect(controller).addUsersToWhitelist(
            currentID, usersArray, [
                parseEther('1000'),
                parseEther('4000'),
                parseEther('5500')
            ]
        )).to.be.revertedWith('The number of addresses must be equal to the number of amounts.');
    });

    mocha.step("STEP10. Checking require by time", async function () {
        await expect(vesting.connect(user1).claim(currentID)).to.be.revertedWith('Vesting start time has not come yet.');
    });

    mocha.step("STEP11. Time movement in EVM", async function () {
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP12. Approve tokens for claiming", async function () {
        await token1.connect(admin).transfer(vesting.address, parseEther('22000'));
    });

    mocha.step("STEP13. Checking balance of vesting after approve tokens for token 1", async function () {
        expect(await token1.balanceOf(vesting.address)).eq(parseEther('22000'));
    });

    mocha.step("STEP14. Checking requires before claiming", async function () {
        await expect(vesting.connect(admin).claim(currentID)).to.be.revertedWith('Sender must be whitelisted.');
        await expect(vesting.connect(user1).claim(10)).to.be.revertedWith('ID does not exist.');
    });

    mocha.step("STEP15. Time movement in EVM (15 days)", async function () {
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 15]); // 15 days / 25% of duration time
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP16. Claiming tokens after 25% of duration vesting time", async function () {
        await vesting.connect(user1).claim(currentID);
    }); 

    mocha.step('STEP17. Checking balance after claim', async function () {
        expect(await token1.balanceOf(user1.address)).to.be.closeTo(parseEther((1000 * 0.25).toString()), delta);
    });

    mocha.step("STEP18. Time movement in EVM (9 days)", async function () {
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 9]); // 9 days / total duration time - 40%
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP19. Claiming tokens after 40% of duration vesting time", async function () {
        await vesting.connect(user1).claim(currentID);
        await vesting.connect(user2).claim(currentID);
        await vesting.connect(user3).claim(currentID);
    });

    mocha.step('STEP20. Checking balance after claim', async function () {
        expect(await token1.balanceOf(user1.address)).to.be.closeTo(parseEther((1000 * 0.4).toString()), delta);
        expect(await token1.balanceOf(user2.address)).to.be.closeTo(parseEther((4000 * 0.4).toString()), delta);
        expect(await token1.balanceOf(user3.address)).to.be.closeTo(parseEther((5500 * 0.4).toString()), delta);
    });

    mocha.step("STEP21. Time movement in EVM (21 days)", async function () {
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 21]); // 21 days / total duration time - 75%
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP22. Claiming tokens after 75% of duration vesting time", async function () {
        await vesting.connect(user1).claim(currentID);
        await vesting.connect(user2).claim(currentID);
        await vesting.connect(user3).claim(currentID);
        await vesting.connect(user4).claim(currentID);
    });

    mocha.step('STEP23. Checking balance after claim', async function () {
        expect(await token1.balanceOf(user1.address)).to.be.closeTo(parseEther((1000 * 0.75).toString()), delta);
        expect(await token1.balanceOf(user2.address)).to.be.closeTo(parseEther((4000 * 0.75).toString()), delta);
        expect(await token1.balanceOf(user3.address)).to.be.closeTo(parseEther((5500 * 0.75).toString()), delta);
        expect(await token1.balanceOf(user4.address)).to.be.closeTo(parseEther((8500 * 0.75).toString()), delta);
    });

    mocha.step("STEP24. Time movement in EVM (15 days)", async function () {
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 15]); // 15 days / total duration time - 100%
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP25. Claiming tokens after 100% of duration vesting time", async function () {
        await vesting.connect(user1).claim(currentID);
        await vesting.connect(user2).claim(currentID);
        await vesting.connect(user3).claim(currentID);
        await vesting.connect(user4).claim(currentID);
        await vesting.connect(user5).claim(currentID);
    });

    mocha.step("STEP26. Checking require after full claim", async function () {
        await expect(vesting.connect(user1).claim(currentID)).to.be.revertedWith("Nothing to claim.");
        await expect(vesting.connect(user2).claim(currentID)).to.be.revertedWith("Nothing to claim.");
        await expect(vesting.connect(user3).claim(currentID)).to.be.revertedWith("Nothing to claim.");
        await expect(vesting.connect(user4).claim(currentID)).to.be.revertedWith("Nothing to claim.");
        await expect(vesting.connect(user5).claim(currentID)).to.be.revertedWith("Nothing to claim.");
    });

    mocha.step("STEP27. Checking balances after full claim", async function () {
        expect(await token1.balanceOf(user1.address)).eq(parseEther('1000'));
        expect(await token1.balanceOf(user2.address)).eq(parseEther('4000'));
        expect(await token1.balanceOf(user3.address)).eq(parseEther('5500'));
        expect(await token1.balanceOf(user4.address)).eq(parseEther('8500'));
        expect(await token1.balanceOf(user5.address)).eq(parseEther('3000'));
        expect(await token1.balanceOf(vesting.address)).eq(parseEther('0'));
    });

    mocha.step("STEP28. Start Second Vesting", async function () {
        const currentTime = await getCurrentTime();
        const startTime = currentTime + 1000;
        const duration = 3600 * 24 * 180; // 180 days
        const name = 'Second Vesting';
        await vesting.connect(admin).createNewVesting(
            startTime, 
            duration, 
            token2.address,
            name
        );  
    });

    mocha.step("STEP29. Adding users to whitelist for second campaign", async function () {
        currentID = await vesting.getLastIdentifier();
        const usersArray = [
            user3.address,
            user4.address,
            user5.address,
            user6.address,
            user7.address,
            user8.address
        ];
        const amountsArray = [ // total = 161000
            parseEther('10000'),
            parseEther('15000'),
            parseEther('44000'),
            parseEther('71000'),
            parseEther('12000'),
            parseEther('9000')
        ];
        await vesting.connect(controller).addUsersToWhitelist(currentID, usersArray, amountsArray);
    });

    mocha.step("STEP30. Time movement in EVM", async function () {
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP31. Approve tokens for claiming", async function () {
        await token2.connect(admin).transfer(vesting.address, parseEther('161000'));
    });

    mocha.step("STEP32. Time movement in EVM (60 days)", async function () {
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 60]); // 60 days / total duration time - 33.33%
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP33. Claiming tokens after 33.33% of duration vesting time", async function () {
        await vesting.connect(user3).claim(currentID);
        await vesting.connect(user4).claim(currentID);
        await vesting.connect(user5).claim(currentID);
        await vesting.connect(user6).claim(currentID);
    });

    mocha.step("STEP34. Checking balance after claim", async function () {
        expect(await token2.balanceOf(user3.address)).to.be.closeTo(parseEther((10000 * 0.33333).toString()), delta);
        expect(await token2.balanceOf(user4.address)).to.be.closeTo(parseEther((15000 * 0.33333).toString()), delta);
        expect(await token2.balanceOf(user5.address)).to.be.closeTo(parseEther((44000 * 0.33333).toString()), delta * 10n);
        expect(await token2.balanceOf(user6.address)).to.be.closeTo(parseEther((71000 * 0.33333).toString()), delta * 10n);
    });

    mocha.step("STEP35. Time movement in EVM (60 days)", async function () {
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 60]); // 60 days / total duration time - 66.66%
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP36. Claiming tokens after 66.66% of duration vesting time", async function () {
        await vesting.connect(user5).claim(currentID);
        await vesting.connect(user6).claim(currentID);
        await vesting.connect(user7).claim(currentID);
        await vesting.connect(user8).claim(currentID);
    });
    
    mocha.step("STEP37. Checking balance after claim", async function () {
        expect(await token2.balanceOf(user5.address)).to.be.closeTo(parseEther((44000 * 0.66666).toString()), delta * 10n);
        expect(await token2.balanceOf(user6.address)).to.be.closeTo(parseEther((71000 * 0.66666).toString()), delta * 10n);
        expect(await token2.balanceOf(user7.address)).to.be.closeTo(parseEther((12000 * 0.66666).toString()), delta);
        expect(await token2.balanceOf(user8.address)).to.be.closeTo(parseEther((9000 * 0.66666).toString()), delta);
    });

    mocha.step("STEP38. Time movement in EVM (60 days)", async function () {
        await ethers.provider.send("evm_increaseTime", [3600 * 24 * 60]); // 60 days / total duration time - 100%
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP39. Claiming tokens after 100% of duration vesting time", async function () {
        await vesting.connect(user3).claim(currentID);
        await vesting.connect(user4).claim(currentID);
        await vesting.connect(user5).claim(currentID);
        await vesting.connect(user6).claim(currentID);
        await vesting.connect(user7).claim(currentID);
        await vesting.connect(user8).claim(currentID);
    });

    mocha.step("STEP40. Checking balance after claim", async function () {
        expect(await token2.balanceOf(user3.address)).eq(parseEther('10000'));
        expect(await token2.balanceOf(user4.address)).eq(parseEther('15000'));
        expect(await token2.balanceOf(user5.address)).eq(parseEther('44000'));
        expect(await token2.balanceOf(user6.address)).eq(parseEther('71000'));
        expect(await token2.balanceOf(user7.address)).eq(parseEther('12000'));
        expect(await token2.balanceOf(user8.address)).eq(parseEther('9000'));
        expect(await token2.balanceOf(vesting.address)).eq(parseEther('0'));
    });

    mocha.step("STEP41. Checking vesting array by name vesting", async function () {
        expect((await vesting.vestings(0)).name).eq('First Vesting');
        expect((await vesting.vestings(1)).name).eq('Second Vesting');
    });
});