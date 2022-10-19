import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import * as mocha from "mocha-steps";
import { parseEther } from '@ethersproject/units';
import { CrepeIDO, ISwapRouter, IERC20Metadata, IWETH9, TokenERC20 } from '../typechain-types';

describe("IDO test", async () => {
    let ido: CrepeIDO;
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
    let user9: SignerWithAddress;
    let user10: SignerWithAddress;
    let controller: SignerWithAddress;
    let stableRecipient: SignerWithAddress;
    let router: ISwapRouter;
    let USDC: IERC20Metadata;
    let WBTC: IERC20Metadata;
    let WETH: IERC20Metadata;
    let USDT: IERC20Metadata;
    let WMATIC: IWETH9;

    let startTime: number;
    let endTime: number;
    let unlockTimestamp: number;
    const nullAddress = '0x0000000000000000000000000000000000000000';
    let approveAmount: BigNumber;

    beforeEach(async () => {
        [admin, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, controller, stableRecipient] = await ethers.getSigners();
    });

    const totalSupplyCrepe = 200_000_000;
    const tokensAddresses = {
        USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
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

    mocha.step("STEP1. Initializing of Router, USDC, WBTC, WETH", async function () {
        router = <ISwapRouter>(await ethers.getContractAt("ISwapRouter", addrRouter));
        USDC = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.USDC));
        USDT = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.USDT));
        WBTC = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.WBTC));
        WETH = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.WETH));
        WMATIC = <IWETH9>(await ethers.getContractAt("IWETH9", tokensAddresses.WMATIC));
    });

    mocha.step('STEP2. Purchase of WBTC, WETH and USDC for MATIC', async function () {
        const inAmount = 7500;
        const params1 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDC, user1.address, inAmount);
        await router.connect(user1).exactInputSingle(params1, { value: parseEther(inAmount.toString()) });

        const params2 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDC, user2.address, inAmount);
        await router.connect(user2).exactInputSingle(params2, { value: parseEther(inAmount.toString()) });

        const params3 = await getParams(tokensAddresses.WMATIC, tokensAddresses.WBTC, user3.address, inAmount);
        await router.connect(user3).exactInputSingle(params3, { value: parseEther(inAmount.toString()) });

        const params4 = await getParams(tokensAddresses.WMATIC, tokensAddresses.WBTC, user4.address, inAmount);
        await router.connect(user4).exactInputSingle(params4, { value: parseEther(inAmount.toString()) });

        const params5 = await getParams(tokensAddresses.WMATIC, tokensAddresses.WETH, user5.address, inAmount);
        await router.connect(user5).exactInputSingle(params5, { value: parseEther(inAmount.toString()) });

        const params6 = await getParams(tokensAddresses.WMATIC, tokensAddresses.WETH, user6.address, inAmount);
        await router.connect(user6).exactInputSingle(params6, { value: parseEther(inAmount.toString()) });

        const params9 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user9.address, inAmount);
        await router.connect(user9).exactInputSingle(params9, { value: parseEther(inAmount.toString()) });

        const params10 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user10.address, inAmount);
        await router.connect(user10).exactInputSingle(params10, { value: parseEther(inAmount.toString()) });

        const bal9 = await USDT.balanceOf(user9.address)
        const bal10 = await USDT.balanceOf(user10.address)
        console.log('balances:', bal9, bal10);
        
    });

    mocha.step('STEP3. Checking balances after purchase', async function () {
        expect(await USDC.balanceOf(user1.address)).to.not.equal(parseEther('0'));
        expect(await USDC.balanceOf(user2.address)).to.not.equal(parseEther('0'));      
        expect(await WBTC.balanceOf(user3.address)).to.not.equal(parseEther('0'));      
        expect(await WBTC.balanceOf(user4.address)).to.not.equal(parseEther('0'));      
        expect(await WETH.balanceOf(user5.address)).to.not.equal(parseEther('0'));      
        expect(await WETH.balanceOf(user6.address)).to.not.equal(parseEther('0'));          
        expect(await USDT.balanceOf(user9.address)).to.not.equal(parseEther('0'));      
        expect(await USDT.balanceOf(user10.address)).to.not.equal(parseEther('0'));     
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
        const IDO = await ethers.getContractFactory("CrepeIDO");
        const usdcDecimals = await USDC.decimals();
        const goal = toWei(14000000, usdcDecimals);
        const minPrice = toWei(0.07, usdcDecimals);
        ido = await IDO.connect(admin).deploy(
            startTime,
            endTime,
            unlockTimestamp,
            crepeToken.address,
            tokensAddresses.USDC,
            router.address,
            goal,
            minPrice
        );
    });

    mocha.step("STEP6. Checking view IDO's functions", async function () {
        expect(await ido.StartIn()).eq(startTime);
        expect(await ido.EndIn()).eq(endTime);
        expect(await ido.UnlockClaimTime()).eq(unlockTimestamp);
        expect(await ido.USDC()).eq(tokensAddresses.USDC);
        expect(await ido.crepe()).eq(crepeToken.address);
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
        await expect(ido.connect(controller).finishCampaign(admin.address)).to.be.revertedWith("Fundraising is still ongoing.");
    });

    mocha.step("STEP10. Checking acces control for changeAcceptedToken", async function () {
        await expect(ido.connect(user8).changeAcceptedToken(tokensAddresses.WBTC)).to.be.revertedWith("You do not have access rights.");
    });

    mocha.step('STEP11. Add accepted address', async function() {
        await ido.connect(controller).changeAcceptedToken(tokensAddresses.WBTC);
        await ido.connect(controller).changeAcceptedToken(tokensAddresses.WETH);
        await ido.connect(controller).changeAcceptedToken(tokensAddresses.USDC);
        await ido.connect(controller).changeAcceptedToken(tokensAddresses.USDT);
        await ido.connect(controller).changeAcceptedToken(nullAddress);
    });

    mocha.step('STEP12. Checking view function AcceptedTokenList', async function () {
        expect(await ido.AcceptedTokenList(tokensAddresses.WBTC)).eq(true);
        expect(await ido.AcceptedTokenList(tokensAddresses.WETH)).eq(true);
        expect(await ido.AcceptedTokenList(tokensAddresses.USDC)).eq(true);
        expect(await ido.AcceptedTokenList(tokensAddresses.USDT)).eq(true);
        expect(await ido.AcceptedTokenList(nullAddress)).eq(true);
        expect(await ido.AcceptedTokenList(router.address)).eq(false);
    });

    mocha.step("STEP13. Checking require by time", async function () {
        await expect(ido.connect(user7).participate(nullAddress, parseEther('0'), parseEther('0'), { value: parseEther('7500') })).to.be.revertedWith('Campaign start time has not come yet.');
    });

    mocha.step('STEP14. Time movement in EVM', async function() {
        await ethers.provider.send("evm_increaseTime", [100]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step('STEP15. Purchase for USDC', async function () {
        const balanceUser1 = await USDC.balanceOf(user1.address);
        const balanceUser2 = await USDC.balanceOf(user2.address);
        await USDC.connect(user1).approve(ido.address, balanceUser1);
        await USDC.connect(user2).approve(ido.address, balanceUser2);
        await ido.connect(user1).participate(USDC.address, balanceUser1, 0);
        await ido.connect(user2).participate(USDC.address, balanceUser2, 0);
        expect(await USDC.balanceOf(ido.address)).eq(balanceUser1.add(balanceUser2));
    });

    mocha.step("STEP16. Checking require for invalid payment token", async function () {
        await expect(ido.connect(user7).participate(user1.address, parseEther('100'), parseEther('0'))).to.be.revertedWith('Invalid payment token.');
    });

    mocha.step('STEP17. Purchase for WBTC', async function () {
        const balanceUser3 = await WBTC.balanceOf(user3.address);
        const balanceUser4 = await WBTC.balanceOf(user4.address);
        const balanceIDOBefore = await USDC.balanceOf(ido.address);
        await WBTC.connect(user3).approve(ido.address, balanceUser3);
        await WBTC.connect(user4).approve(ido.address, balanceUser4);
        await ido.connect(user3).participate(WBTC.address, balanceUser3, 0);
        await ido.connect(user4).participate(WBTC.address, balanceUser4, 0);
        const balanceIDOAfter = await USDC.balanceOf(ido.address);
        expect(balanceIDOBefore).to.not.equal(balanceIDOAfter);      
    });

    mocha.step('STEP18. Purchase for WETH', async function () {
        const balanceUser5 = await WETH.balanceOf(user5.address);
        const balanceUser6 = await WETH.balanceOf(user6.address);
        const balanceIDOBefore = await USDC.balanceOf(ido.address);
        await WETH.connect(user5).approve(ido.address, balanceUser5);
        await WETH.connect(user6).approve(ido.address, balanceUser6);
        await ido.connect(user5).participate(WETH.address, balanceUser5, 0);
        await ido.connect(user6).participate(WETH.address, balanceUser6, 0);
        const balanceIDOAfter = await USDC.balanceOf(ido.address);
        expect(balanceIDOBefore).to.not.equal(balanceIDOAfter);             
    });

    mocha.step("STEP19. Sending 0 MATIC", async function () {
        await expect(ido.connect(user7).participate(nullAddress, parseEther('100'), 0)).to.be.revertedWith('You sent 0 MATIC');
    });

    mocha.step('STEP20. Purchase for MATIC', async function () {
        const balanceIDOBefore = await USDC.balanceOf(ido.address);
        await ido.connect(user7).participate(nullAddress, parseEther('7500'), 0, { value: parseEther('7500') });
        await ido.connect(user8).participate(nullAddress, parseEther('7500'), 0, { value: parseEther('7500') });
        const balanceIDOAfter = await USDC.balanceOf(ido.address);    
        expect(balanceIDOBefore).to.not.equal(balanceIDOAfter);
    });

    mocha.step('STEP. Purchase for USDT', async function () {
        const balanceUser9 = await USDT.balanceOf(user9.address);
        const balanceUser10 = await USDT.balanceOf(user10.address);
        const balanceIDOBefore = await USDC.balanceOf(ido.address);
        await USDT.connect(user9).approve(ido.address, balanceUser9);
        await USDT.connect(user10).approve(ido.address, balanceUser10);
        await ido.connect(user9).participate(USDT.address, balanceUser9, 0);
        await ido.connect(user10).participate(USDT.address, balanceUser10, 0);
        const balanceIDOAfter = await USDC.balanceOf(ido.address);
        expect(balanceIDOBefore).to.not.equal(balanceIDOAfter);      
    });

    mocha.step('STEP21. Time movement in EVM', async function() {
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP22. Checking require by time", async function () {
        await expect(ido.connect(user7).participate(nullAddress, parseEther('0'), parseEther('0'), { value: parseEther('500') })).to.be.revertedWith('Campaign time has expired.');
    });

    mocha.step("STEP23. Checking access controll for approveCampaign", async function () {
        await expect(ido.connect(user7).approveCampaign(admin.address, parseEther('1000'))).to.be.revertedWith("You do not have access rights.");
    });

    mocha.step('STEP24. Approving campaign', async function () {
        const crepeDecimals = await crepeToken.decimals();
        approveAmount = toWei(totalSupplyCrepe, crepeDecimals);
        await crepeToken.connect(admin).approve(ido.address, approveAmount);
        await ido.connect(controller).approveCampaign(admin.address, approveAmount);
    });

    mocha.step("STEP25. Checking balance after approve", async function () {
        expect(await crepeToken.balanceOf(ido.address)).eq(approveAmount);
    });

    mocha.step("STEP26. Checking require by time", async function () {
        await expect(ido.connect(user7).claimToken()).to.be.revertedWith('The time of the unlock has not yet come');
    });

    mocha.step('STEP27. Time movement in EVM', async function () {
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step('STEP28. Checking access control for finishCampaign', async function () {
        await expect(ido.connect(user7).finishCampaign(admin.address)).to.be.revertedWith("You do not have access rights.");
    });

    mocha.step("STEP29. Finishing campaign and withdrawing assets", async function () {
        expect(await USDC.balanceOf(admin.address)).eq(0);
        const balanceBeforeFinish = await USDC.balanceOf(ido.address);
        await ido.connect(controller).finishCampaign(admin.address);
        expect(await USDC.balanceOf(admin.address)).eq(balanceBeforeFinish);
    });

    mocha.step("STEP30. Claiming Crepe tokens", async function () {
        await ido.connect(user1).claimToken();
        await ido.connect(user2).claimToken();
        await ido.connect(user3).claimToken();
        await ido.connect(user4).claimToken();
        await ido.connect(user5).claimToken();
        await ido.connect(user6).claimToken();
        await ido.connect(user7).claimToken();
        await ido.connect(user8).claimToken();
        await ido.connect(user9).claimToken();
        // await ido.connect(user10).claimToken();
    });

    mocha.step('STEP31. Checking require after claiming', async function () {
        await expect(ido.connect(user1).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user2).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user3).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user4).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user5).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user6).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user7).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user8).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user9).claimToken()).to.be.revertedWith('Nothing to claim.');
        await expect(ido.connect(user10).claimToken()).to.be.revertedWith('Nothing to claim.');
    });

    mocha.step('STEP32. Checking Crepe balance after all claims', async function () {
        const bal = await crepeToken.balanceOf(ido.address);
        console.log("Remaining Crepe on contract IDO:", bal.toString(), "Decimals - 18");
    });
});