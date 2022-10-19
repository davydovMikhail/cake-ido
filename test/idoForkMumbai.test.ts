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
    let router: ISwapRouter;
    let USDC: IERC20Metadata;
    let WETH: IERC20Metadata;
    let WMATIC: IWETH9;

    const nullAddress = '0x0000000000000000000000000000000000000000';

    beforeEach(async () => {
        [admin, user1, user2, user3, user4] = await ethers.getSigners();
    });

    const totalSupplyCrepe = 200_000_000;

    const tokensAddresses = {
        USDC: '0x7b16c00A9848aBFc470A1bca2227e839c9E8E424',
        WETH: '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa',
        WMATIC: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889'
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
            deadline: timestamp + 20,
            amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        }
    }

    mocha.step("STEP1. Initializing of Router, USDC, WETH", async function () {
        router = <ISwapRouter>(await ethers.getContractAt("ISwapRouter", addrRouter));
        USDC = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.USDC));
        WETH = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.WETH));
        WMATIC = <IWETH9>(await ethers.getContractAt("IWETH9", tokensAddresses.WMATIC));
    });

    mocha.step('STEP2. Purchase of WETH for MATIC', async function () {
        const inAmount = 5;

        const params1 = await getParams(tokensAddresses.WMATIC, tokensAddresses.WETH, user1.address, inAmount);
        await router.connect(user1).exactInputSingle(params1, { value: parseEther(inAmount.toString()) });

        const params2 = await getParams(tokensAddresses.WMATIC, tokensAddresses.WETH, user2.address, inAmount);
        await router.connect(user2).exactInputSingle(params2, { value: parseEther(inAmount.toString()) });
    });

    mocha.step('STEP3. Deploy Crepe Token', async function () {
        const CrepeToken = await ethers.getContractFactory("TokenERC20");
        const name = "Crepe Token Test";
        const symbol = "CTT";
        const crepeDecimals = 18;
        const totalSupplyCrepeWei = toWei(totalSupplyCrepe, crepeDecimals);
        crepeToken = await CrepeToken.connect(admin).deploy(
            name,
            symbol,
            totalSupplyCrepeWei
        );
    });

    mocha.step('STEP4. Deploying IDO', async function () {
        const currentTimestamp = await getCurrentTime();
        const startTime = currentTimestamp + 100;
        const endTime = startTime + 1000;
        const unlockTimestamp = endTime + 1000;
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

    mocha.step('STEP5. Add accepted address', async function() {
        await ido.connect(admin).changeAcceptedToken(tokensAddresses.WETH);
        await ido.connect(admin).changeAcceptedToken(tokensAddresses.USDC);
        await ido.connect(admin).changeAcceptedToken(nullAddress);
    });

    mocha.step('STEP6. Start IDO', async function() {
        await ethers.provider.send("evm_increaseTime", [100]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step('STEP7. Purchase for WETH', async function () {
        const balanceUser1 = await WETH.balanceOf(user1.address);
        const balanceUser2 = await WETH.balanceOf(user2.address);
        const balanceIDOBefore = await USDC.balanceOf(ido.address);
        await WETH.connect(user1).approve(ido.address, balanceUser1);
        await WETH.connect(user2).approve(ido.address, balanceUser2);
        await ido.connect(user1).participate(WETH.address, balanceUser1, 0);
        await ido.connect(user2).participate(WETH.address, balanceUser2, 0);
        const balanceIDOAfter = await USDC.balanceOf(ido.address);
        expect(balanceIDOAfter).to.not.equal(balanceIDOBefore);   
    });

    mocha.step('STEP8. Purchase for MATIC', async function () {
        const balanceIDOBefore = await USDC.balanceOf(ido.address);
        await expect(ido.connect(user3).participate(nullAddress, parseEther('100'), 0)).to.be.revertedWith('You sent 0 MATIC');
        await ido.connect(user3).participate(nullAddress, parseEther('7500'), 0, { value: parseEther('7500') });
        await ido.connect(user4).participate(nullAddress, parseEther('7500'), 0, { value: parseEther('7500') });
        const balanceIDOAfter = await USDC.balanceOf(ido.address);
        expect(balanceIDOAfter).to.not.equal(balanceIDOBefore);          
    });

    mocha.step('STEP9. Finishing IDO', async function () {
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step('STEP10. Approving campaign', async function () {
        const crepeDecimals = await crepeToken.decimals();
        const approveAmount = toWei(totalSupplyCrepe, crepeDecimals);
        await crepeToken.connect(admin).approve(ido.address, approveAmount);
        await ido.connect(admin).approveCampaign(admin.address, approveAmount);
        expect(await crepeToken.balanceOf(ido.address)).eq(approveAmount);
    });

    mocha.step('STEP11. Start claiming Crepe tokens', async function () {
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step("STEP12. Finishing campaign and withdrawing assets", async function () {
        expect(await USDC.balanceOf(admin.address)).eq(0);
        const balanceBeforeFinish = await USDC.balanceOf(ido.address);
        await ido.connect(admin).finishCampaign(admin.address);
        expect(await USDC.balanceOf(admin.address)).eq(balanceBeforeFinish);
    });

    mocha.step('STEP13. Claiming Crepe tokens', async function () {
        await ido.connect(user1).claimToken();
        await ido.connect(user2).claimToken();
        await ido.connect(user3).claimToken();
        await ido.connect(user4).claimToken();
        await expect(ido.connect(user4).claimToken()).to.be.revertedWith('Nothing to claim.');
        expect(await crepeToken.balanceOf(ido.address)).to.be.closeTo(parseEther('0'), 10n);
    })

    mocha.step('STEP14. Checking Crepe balance after all claims', async function () {
        const bal = await crepeToken.balanceOf(ido.address);
        console.log("Remaining Crepe on contract IDO:", bal.toString(), "Decimals - 18");
    });
});