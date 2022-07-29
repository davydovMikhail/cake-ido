import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {  Contract } from "ethers";
import * as mocha from "mocha-steps";
import { parseEther } from '@ethersproject/units';
import { Crepe, CrepeTokenTest, ISwapRouter, IERC20Metadata, IWETH9 } from '../typechain-types';
import BigNumber from "bignumber.js";

describe("IDO test", async () => {
    let ido: Crepe;
    let crepeToken: CrepeTokenTest;
    let admin: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let user4: SignerWithAddress;
    let user5: SignerWithAddress;
    let user6: SignerWithAddress;
    let user7: SignerWithAddress;
    let user8: SignerWithAddress;
    let router: ISwapRouter;
    let USDC: IERC20Metadata;
    let WBTC: IERC20Metadata;
    let WETH: IERC20Metadata;
    let WMATIC: IWETH9;

    let decUSDC: number;
    let decWBTC: number;
    let decWETH: number;

    const nullAddress = '0x0000000000000000000000000000000000000000';

    beforeEach(async () => {
        [admin, user1, user2, user3, user4, user5, user6, user7, user8] = await ethers.getSigners();
    });

    // let currentTimestamp = Math.floor(Date.now() / 1000);
    // // const currentTimestamp = await getCurrentTime();
    
    
    
    // const startTime = currentTimestamp + 100;
    // const endTime = startTime + 1000;
    // const unlockTimestamp = endTime + 1000;
    const totalSupplyCrepe = 1000_000;

    const tokensAddresses = {
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
    }

    const addrUSDC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
    const addrRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';


    async function getCurrentTime() {
        let blockNumber = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNumber);
        return block.timestamp;
    }

    async function plusDecimals(num: any, dec: any) {
        const value = new BigNumber(num.toString()).shiftedBy(+dec).toString();
        return value;
    }

    async function minusDecimals(num: any, dec: any) {
        const value = new BigNumber(num.toString()).shiftedBy(-dec).toString();
        return value;
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

    mocha.step("STEP1. Initializing of Router, USDC, WBTC, WETH", async function () {
        router = <ISwapRouter>(await ethers.getContractAt("ISwapRouter", addrRouter));
        USDC = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.USDC));
        WBTC = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.WBTC));
        WETH = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.WETH));
        WMATIC = <IWETH9>(await ethers.getContractAt("IWETH9", tokensAddresses.WMATIC));
        decUSDC = await USDC.decimals();
        decWBTC = await WBTC.decimals();
        decWETH = await WETH.decimals();
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
    });

    mocha.step('STEP3. Checking balances after purchase', async function () {
        let balance1: any = await USDC.balanceOf(user1.address);
        let balance2: any = await USDC.balanceOf(user2.address);
        let balance3: any = await WBTC.balanceOf(user3.address);
        let balance4: any = await WBTC.balanceOf(user4.address);
        let balance5: any = await WETH.balanceOf(user5.address);
        let balance6: any = await WETH.balanceOf(user6.address);

        balance1 = await minusDecimals(balance1, decUSDC);
        balance2 = await minusDecimals(balance2, decUSDC);
        balance3 = await minusDecimals(balance3, decWBTC);
        balance4 = await minusDecimals(balance4, decWBTC);
        balance5 = await minusDecimals(balance5, decWETH);
        balance6 = await minusDecimals(balance6, decWETH);

        console.log('Balance user 1 USDC:', balance1);
        console.log('Balance user 2 USDC:', balance2);
        console.log('Balance user 3 WBTC:', balance3);
        console.log('Balance user 4 WBTC:', balance4);
        console.log('Balance user 5 WETH:', balance5);
        console.log('Balance user 6 WETH:', balance6);
    })

    

    mocha.step('STEP4. Deploy Crepe Token', async function () {
        const CrepeToken = await ethers.getContractFactory("CrepeTokenTest");
        const name = "Crepe Token Test";
        const symbol = "CTT";
        crepeToken = await CrepeToken.connect(admin).deploy(
            name,
            symbol,
            parseEther(totalSupplyCrepe.toString())
        );
    });

    mocha.step('STEP5. Deploying IDO', async function () {
        // let currentTimestamp = Math.floor(Date.now() / 1000);
        const currentTimestamp = await getCurrentTime();
        const startTime = currentTimestamp + 100;
        const endTime = startTime + 1000;
        const unlockTimestamp = endTime + 1000;
        console.log('Current timestamp of step 5:', currentTimestamp);
        console.log('Timestamp start IDO:', startTime);
        console.log('Timestamp end IDO:', endTime);
        console.log('Timestamp claim tokens:', unlockTimestamp);
        

        const IDO = await ethers.getContractFactory("Crepe");
        ido = await IDO.connect(admin).deploy(
            startTime,
            endTime,
            unlockTimestamp,
            crepeToken.address,
            addrUSDC,
            router.address
        );
    });

    mocha.step('STEP6. Add accepted address', async function() {
        await ido.connect(admin).addAcceptedToken(tokensAddresses.WBTC);
        await ido.connect(admin).addAcceptedToken(tokensAddresses.WETH);
        await ido.connect(admin).addAcceptedToken(tokensAddresses.USDC);
        await ido.connect(admin).addAcceptedToken(nullAddress);
    });

    mocha.step('STEP7. Start IDO', async function() {
        await expect(ido.connect(user7).joinToCampaign(nullAddress, parseEther('0'), parseEther('0'), { value: parseEther('7500') })).to.be.revertedWith('Campaign start time has not come yet.');
        await ethers.provider.send("evm_increaseTime", [100]);
        await ethers.provider.send("evm_mine", []);
    });

    mocha.step('STEP8. Purchase for USDC', async function () {
        const balanceUser1 = await USDC.balanceOf(user1.address);
        const balanceUser2 = await USDC.balanceOf(user2.address);
        await USDC.connect(user1).approve(ido.address, balanceUser1);
        await USDC.connect(user2).approve(ido.address, balanceUser2);

        await expect(ido.connect(user7).joinToCampaign(user1.address, parseEther('100'), parseEther('0'))).to.be.revertedWith('Invalid payment token.');

        await ido.connect(user1).joinToCampaign(USDC.address, balanceUser1, 0);
        await ido.connect(user2).joinToCampaign(USDC.address, balanceUser2, 0);
        expect(await USDC.balanceOf(ido.address)).eq(balanceUser1.add(balanceUser2));
    });


});