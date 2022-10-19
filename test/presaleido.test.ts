import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import * as mocha from "mocha-steps";
import { parseEther } from '@ethersproject/units';
import { PresaleIDO, ISwapRouter, IERC20Metadata, TokenERC20 } from '../typechain-types';

describe("Presale IDO test", async () => {
    let ido: PresaleIDO;
    let crepeToken: TokenERC20;
    let admin: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let user4: SignerWithAddress;
    let user5: SignerWithAddress;
    let user6: SignerWithAddress;
    let user7: SignerWithAddress;
    let user8: SignerWithAddress;
    let users: SignerWithAddress[];

    let controller: SignerWithAddress;
    
    let router: ISwapRouter;
    let USDC: IERC20Metadata;
    let USDT: IERC20Metadata;

    let startTime: number;
    let endTime: number;
    let unlockTimestamp: number;
    const nullAddress = '0x0000000000000000000000000000000000000000';
    let approveAmount: BigNumber;   

    beforeEach(async () => {
        [admin, user1, user2, user3, user4, user5, user6, user7, user8, controller, ...users] = await ethers.getSigners();
    });

    const totalSupplyCrepe = 14_000_000;
    const tokensAddresses = {
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
    }

    const addrRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

    async function getCurrentTime() {
        let blockNumber = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNumber);
        return block.timestamp;
    }

    function toWei(amount: number, decimals: number): BigNumber {
        return ethers.utils.parseUnits(amount.toString(), decimals);
    }

    async function getParams(tokenIn: string, tokenOut: string, recipient: string, _amountIn: number) {
        const amountIn = parseEther(_amountIn.toString());
        const timestamp = await getCurrentTime();
        return {
            tokenIn,
            tokenOut,
            fee: 3000,
            recipient,
            deadline: timestamp + 60,
            amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        }
    }

    mocha.step("STEP1. Initializing of Router, USDC, USDT", async function () {
        router = <ISwapRouter>(await ethers.getContractAt("ISwapRouter", addrRouter));
        USDC = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.USDC));
        USDT = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.USDT));
    });

    mocha.step('STEP2. Purchase of USDT and USDC for MATIC', async function () {
        const inAmount = 7500;
        const params1 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDC, user1.address, inAmount);
        await router.connect(user1).exactInputSingle(params1, { value: parseEther(inAmount.toString()) });

        const params2 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDC, user2.address, inAmount);
        await router.connect(user2).exactInputSingle(params2, { value: parseEther(inAmount.toString()) });

        const params3 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDC, user3.address, inAmount);
        await router.connect(user3).exactInputSingle(params3, { value: parseEther(inAmount.toString()) });

        const params4 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user4.address, inAmount);
        await router.connect(user4).exactInputSingle(params4, { value: parseEther(inAmount.toString()) });

        const params5 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user5.address, inAmount);
        await router.connect(user5).exactInputSingle(params5, { value: parseEther(inAmount.toString()) });

        const params6 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user6.address, inAmount);
        await router.connect(user6).exactInputSingle(params6, { value: parseEther(inAmount.toString()) });
    });

    // mocha.step('Additional for STEP2', async function () {
    //     const inAmount = 5000;
    //     for (let i = 0; i < users.length; i++) {
    //         const params = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDC, users[i].address, inAmount);
    //         await router.connect(users[i]).exactInputSingle(params, { value: parseEther(inAmount.toString()) });
    //         console.log('Purchase directly on Uniswap ', i);
    //     }
    // });
    
    mocha.step('STEP3. Checking balances after purchase', async function () {
        expect(await USDC.balanceOf(user1.address)).to.not.equal(parseEther('0'));
        expect(await USDC.balanceOf(user2.address)).to.not.equal(parseEther('0'));      
        expect(await USDC.balanceOf(user3.address)).to.not.equal(parseEther('0'));      
        expect(await USDT.balanceOf(user4.address)).to.not.equal(parseEther('0'));      
        expect(await USDT.balanceOf(user5.address)).to.not.equal(parseEther('0'));      
        expect(await USDT.balanceOf(user6.address)).to.not.equal(parseEther('0'));                
    })

    mocha.step('STEP4. Deploy Crepe Token', async function () {
        const CrepeToken = await ethers.getContractFactory("TokenERC20");
        const name = "Crepe Token Test";
        const symbol = "CTT";
        const totalSupplyCrepeWei = parseEther(totalSupplyCrepe.toString());
        crepeToken = await CrepeToken.connect(admin).deploy(
            name,
            symbol,
            totalSupplyCrepeWei
        );
        expect(await crepeToken.name()).eq(name);
        expect(await crepeToken.symbol()).eq(symbol);
        expect(await crepeToken.decimals()).eq(18);
    });

    mocha.step('STEP5. Deploying IDO', async function () {
        const currentTimestamp = await getCurrentTime();
        startTime = currentTimestamp + 100;
        endTime = startTime + 1000;
        unlockTimestamp = endTime + 1000;
        const IDO = await ethers.getContractFactory("PresaleIDO");
        const usdcDecimals = await USDC.decimals();
        const goal = toWei(980000, usdcDecimals);
        const minPrice = toWei(0.07, usdcDecimals);
        ido = await IDO.connect(admin).deploy(
            startTime,
            endTime,
            unlockTimestamp,
            crepeToken.address,
            tokensAddresses.USDC,
            tokensAddresses.USDT,
            goal,
            minPrice,
            admin.address
        );
    });

    mocha.step("STEP6. Checking view IDO's functions", async function () {
        expect(await ido.StartIn()).eq(startTime);
        expect(await ido.EndIn()).eq(endTime);
        expect(await ido.UnlockClaimTime()).eq(unlockTimestamp);
        expect(await ido.USDC()).eq(tokensAddresses.USDC);
        expect(await ido.USDT()).eq(tokensAddresses.USDT);
        expect(await ido.TotalAccumulated()).eq(0);
        expect(await ido.TotalCrepe()).eq(0);
    });

    mocha.step("STEP7. Grant role for token controller", async function () {
        await ido.connect(admin).grantRole((await ido.CONTRACT_CONTROL_ROLE()), controller.address);
    });

    mocha.step("STEP8. Checking access control for ADMIN_ROLE", async function () {
        await expect(ido.connect(user8).grantRole((await ido.CONTRACT_CONTROL_ROLE()), controller.address)).to.be.revertedWith(`AccessControl: account ${user8.address.toLowerCase()} is missing role ${(await ido.ADMIN_ROLE()).toLowerCase()}`);
    });

    mocha.step("STEP9. Checking the require in the IDO completion function before starting", async function () {
        await expect(ido.connect(controller).finishCampaign()).to.be.revertedWith("Fundraising is still ongoing.");
    });

    mocha.step("STEP10. Checking require by time", async function () {
        await expect(ido.connect(user7).participate(nullAddress, parseEther('0'))).to.be.revertedWith('Campaign start time has not come yet.');
    });

    mocha.step('STEP11. Time movement in EVM', async function() {
        await ethers.provider.send("evm_increaseTime", [100]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step('STEP12. Purchase for USDC', async function () {
        const balanceUser1 = await USDC.balanceOf(user1.address);
        const balanceUser2 = await USDC.balanceOf(user2.address);
        const balanceUser3 = await USDC.balanceOf(user3.address);
        await USDC.connect(user1).approve(ido.address, balanceUser1);
        await USDC.connect(user2).approve(ido.address, balanceUser2);
        await USDC.connect(user3).approve(ido.address, balanceUser3);
        await ido.connect(user1).participate(USDC.address, balanceUser1);
        await ido.connect(user2).participate(USDC.address, balanceUser2);
        await ido.connect(user3).participate(USDC.address, balanceUser3);
        expect(await USDC.balanceOf(ido.address)).eq(balanceUser1.add(balanceUser2).add(balanceUser3));
    });

    // mocha.step('Additional for STEP12', async function () {
    //     for (let i = 0; i < users.length; i++) {
    //         const balance = await USDC.balanceOf(users[i].address);
    //         await USDC.connect(users[i]).approve(ido.address, balance);
    //         await ido.connect(users[i]).participate(USDC.address, balance);
    //         console.log('Participated ', i);
    //     }
    // });

    mocha.step("STEP13. Checking require for invalid payment token", async function () {
        await expect(ido.connect(user7).participate(user1.address, parseEther('100'))).to.be.revertedWith('Invalid payment token.');
    });

    mocha.step('STEP14. Purchase for USDT', async function () {
        const balanceUser4 = await USDT.balanceOf(user4.address);
        const balanceUser5 = await USDT.balanceOf(user5.address);
        const balanceUser6 = await USDT.balanceOf(user6.address);
        const balanceIDOBefore = await USDT.balanceOf(ido.address);
        await USDT.connect(user4).approve(ido.address, balanceUser4);
        await USDT.connect(user5).approve(ido.address, balanceUser5);
        await USDT.connect(user6).approve(ido.address, balanceUser6);
        await ido.connect(user4).participate(USDT.address, balanceUser4);
        await ido.connect(user5).participate(USDT.address, balanceUser5);
        await ido.connect(user6).participate(USDT.address, balanceUser6);
        const balanceIDOAfter = await USDT.balanceOf(ido.address);
        expect(balanceIDOBefore).to.not.equal(balanceIDOAfter);      
    });

    mocha.step('STEP15. Time movement in EVM', async function() {
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine", []);
    });
    
    mocha.step("STEP16. Checking require by time", async function () {
        await expect(ido.connect(user7).participate(USDT.address, parseEther('0'))).to.be.revertedWith('Campaign time has expired.');
    });

    mocha.step("STEP17. Checking access controll for approveCampaign", async function () {
        await expect(ido.connect(user7).approveCampaign(admin.address, parseEther('1000'))).to.be.revertedWith("You do not have access rights.");
    });

    mocha.step('STEP18. Approving campaign', async function () {
        const crepeDecimals = await crepeToken.decimals();
        approveAmount = toWei(totalSupplyCrepe, crepeDecimals);
        await crepeToken.connect(admin).approve(ido.address, approveAmount);
        await ido.connect(controller).approveCampaign(admin.address, approveAmount);
    });

    mocha.step("STEP19. Checking balance after approve", async function () {
        expect(await crepeToken.balanceOf(ido.address)).eq(approveAmount);
    });

    mocha.step("STEP20. Checking require by time", async function () {
        await expect(ido.connect(user7).claimToken()).to.be.revertedWith('The time of the unlock has not yet come');
    });

    mocha.step('STEP21. Time movement in EVM', async function () {
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step('STEP22. Checking access control for finishCampaign', async function () {
        await expect(ido.connect(user7).finishCampaign()).to.be.revertedWith("You do not have access rights.");
    });

    mocha.step("STEP23. Claiming Crepe tokens", async function () {
        await ido.connect(user1).claimToken();
        await ido.connect(user2).claimToken();
        await ido.connect(user3).claimToken();
        await ido.connect(user4).claimToken();
        await ido.connect(user5).claimToken();
        await ido.connect(user6).claimToken();
    });

    mocha.step("STEP24. Finishing campaign and withdrawing assets", async function () {
        expect(await USDC.balanceOf(admin.address)).eq(0);
        const balanceBeforeFinish = await USDC.balanceOf(ido.address);
        await ido.connect(controller).finishCampaign();
        expect(await USDC.balanceOf(admin.address)).eq(balanceBeforeFinish);
    });
    
    // mocha.step('Additional for STEP23', async function () {
    //     for (let i = 0; i < users.length; i++) {
    //         await ido.connect(users[i]).claimToken();
    //         console.log('Claimed ', i);
    //     }
    // });

    mocha.step('STEP25. Checking require after claiming', async function () {
        await expect(ido.connect(user1).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user2).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user3).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user4).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user5).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user6).claimToken()).to.be.revertedWith('Nothing to claim.');
    });

    mocha.step('STEP26. Checking Crepe balance after all claims', async function () {
        const balCrepe = await crepeToken.balanceOf(ido.address);
        const balUSDC = await USDC.balanceOf(ido.address);
        const balUSDT = await USDT.balanceOf(ido.address);
        console.log("Remaining Crepe on contract IDO:", balCrepe.toString(), "Decimals - 18");
        console.log("Remaining USDC on contract IDO:", balUSDC.toString());
        console.log("Remaining USDT on contract IDO:", balUSDT.toString());
    });
});
