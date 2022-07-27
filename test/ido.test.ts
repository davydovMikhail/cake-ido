import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import * as mocha from "mocha-steps";
import { parseEther } from '@ethersproject/units';
import { Crepe, CrepeTokenTest, IUniswapRouter } from '../typechain-types';

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
    let router: IUniswapRouter;

    beforeEach(async () => {
        [admin, user1, user2, user3, user4, user5, user6, user7] = await ethers.getSigners();
    });

    let currentTimestamp = Math.floor(Date.now() / 1000);
    const startTime = currentTimestamp + 100;
    const endTime = startTime + 1000;
    const unlockTimestamp = endTime + 1000;
    const totalSupplyCrepe = 1000_000;

    const tokensAddresses = {
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
    }

    const addrUSDC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
    const addrRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

    mocha.step("STEP1. Initializing of Router, WETH", async function () {
        router = <IUniswapRouter>(await ethers.getContractAt("IUniswapRouter", addrRouter));
    });

    mocha.step('STEP2. Deploy Crepe Token', async function () {
        const CrepeToken = await ethers.getContractFactory("CrepeTokenTest");
        const name = "Crepe Token Test";
        const symbol = "CTT";
        crepeToken = await CrepeToken.connect(admin).deploy(
            name,
            symbol,
            parseEther(totalSupplyCrepe.toString())
        );
    });

    mocha.step('STEP3. Deploying IDO', async function () {
        const IDO = await ethers.getContractFactory("Crepe");
        ido = await IDO.connect(admin).deploy(
            startTime,
            endTime,
            unlockTimestamp,
            crepeToken.address,
            addrUSDC
        );
    });

});