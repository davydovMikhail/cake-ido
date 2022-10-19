import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { parseEther } from '@ethersproject/units';
import { ISwapRouter, IERC20Metadata } from '../typechain-types';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Presale IDO test", async () => {
    let admin: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let user4: SignerWithAddress;
    let user5: SignerWithAddress;
    let user6: SignerWithAddress;
    let users: SignerWithAddress[];

    let startTime: number;
    let endTime: number;
    let unlockTimestamp: number;
    let approveAmount: BigNumber;   

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

    async function initializingEnvironment() {
        const router = <ISwapRouter>(await ethers.getContractAt("ISwapRouter", addrRouter));
        const USDC = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.USDC));
        const USDT = <IERC20Metadata>(await ethers.getContractAt("IERC20Metadata", tokensAddresses.USDT));

        const inAmount = 7500;
        const params1 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user1.address, inAmount);
        await router.connect(user1).exactInputSingle(params1, { value: parseEther(inAmount.toString()) });

        const params2 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user2.address, inAmount);
        await router.connect(user2).exactInputSingle(params2, { value: parseEther(inAmount.toString()) });

        const params3 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user3.address, inAmount);
        await router.connect(user3).exactInputSingle(params3, { value: parseEther(inAmount.toString()) });

        const params4 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user4.address, inAmount);
        await router.connect(user4).exactInputSingle(params4, { value: parseEther(inAmount.toString()) });

        const params5 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user5.address, inAmount);
        await router.connect(user5).exactInputSingle(params5, { value: parseEther(inAmount.toString()) });

        const params6 = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDT, user6.address, inAmount);
        await router.connect(user6).exactInputSingle(params6, { value: parseEther(inAmount.toString()) });

        for (let i = 0; i < users.length; i++) {
            const params = await getParams(tokensAddresses.WMATIC, tokensAddresses.USDC, users[i].address, inAmount);
            await router.connect(users[i]).exactInputSingle(params, { value: parseEther(inAmount.toString()) });
            console.log('Purchase directly on Uniswap ', i);
        }

        const CrepeToken = await ethers.getContractFactory("TokenERC20");
        const name = "Crepe Token Test";
        const symbol = "CTT";
        const totalSupplyCrepeWei = parseEther(totalSupplyCrepe.toString());
        const crepeToken = await CrepeToken.connect(admin).deploy(
            name,
            symbol,
            totalSupplyCrepeWei
        );

        const currentTimestamp = await getCurrentTime();
        startTime = currentTimestamp + 100;
        endTime = startTime + 1000;
        unlockTimestamp = endTime + 1000;
        const IDO = await ethers.getContractFactory("PresaleIDO");
        const usdcDecimals = await USDC.decimals();
        const goal = toWei(980000, usdcDecimals);
        const minPrice = toWei(0.07, usdcDecimals);
        const ido = await IDO.connect(admin).deploy(
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

        await ethers.provider.send("evm_increaseTime", [100]);
        await ethers.provider.send("evm_mine", []);

        return { USDC, USDT, crepeToken, ido};
    }

    // const { USDC, USDT, crepeToken, ido } = await loadFixture(initializingEnvironment);

    it("stress test", async () => {
       
        [admin, user1, user2, user3, user4, user5, user6, ...users] = await ethers.getSigners();
        
        const { USDC, USDT, crepeToken, ido } = await loadFixture(initializingEnvironment);

        let participants = 1;

        for (let j = 0; j < users.length; j++) {
            const { USDC, USDT, crepeToken, ido } = await loadFixture(initializingEnvironment);

            

            const balanceUser1 = await USDT.balanceOf(user1.address);
            const balanceUser2 = await USDT.balanceOf(user2.address);
            const balanceUser3 = await USDT.balanceOf(user3.address);
            const balanceUser4 = await USDT.balanceOf(user4.address);
            const balanceUser5 = await USDT.balanceOf(user5.address);
            const balanceUser6 = await USDT.balanceOf(user6.address);
            await USDT.connect(user1).approve(ido.address, balanceUser1);
            await USDT.connect(user2).approve(ido.address, balanceUser2);
            await USDT.connect(user3).approve(ido.address, balanceUser3);
            await USDT.connect(user4).approve(ido.address, balanceUser4);
            await USDT.connect(user5).approve(ido.address, balanceUser5);
            await USDT.connect(user6).approve(ido.address, balanceUser6);
            await ido.connect(user1).participate(USDT.address, balanceUser1);
            await ido.connect(user2).participate(USDT.address, balanceUser2);
            await ido.connect(user3).participate(USDT.address, balanceUser3);
            await ido.connect(user4).participate(USDT.address, balanceUser4);
            await ido.connect(user5).participate(USDT.address, balanceUser5);
            await ido.connect(user6).participate(USDT.address, balanceUser6);
        

            for (let i = 0; i < participants; i++) {
                const balance = await USDC.balanceOf(users[i].address);
                await USDC.connect(users[i]).approve(ido.address, balance);
                await ido.connect(users[i]).participate(USDC.address, balance);
            }
                
            await ethers.provider.send("evm_increaseTime", [1000]);
            await ethers.provider.send("evm_mine", []);
    
        
        
            const crepeDecimals = await crepeToken.decimals();
            approveAmount = toWei(totalSupplyCrepe, crepeDecimals);
            await crepeToken.connect(admin).approve(ido.address, approveAmount);
            await ido.connect(admin).approveCampaign(admin.address, approveAmount);
            
        
        
            await ethers.provider.send("evm_increaseTime", [1000]);
            await ethers.provider.send("evm_mine", []);
    
    
            await ido.connect(user1).claimToken();
            await ido.connect(user2).claimToken();
            await ido.connect(user3).claimToken();
            await ido.connect(user4).claimToken();
            await ido.connect(user5).claimToken();
            await ido.connect(user6).claimToken();
            
        
            expect(await USDC.balanceOf(admin.address)).eq(0);
            const balanceBeforeFinish = await USDC.balanceOf(ido.address);
            const balanceBeforeFinishUSDT = await USDT.balanceOf(ido.address);

            await ido.connect(admin).finishCampaign();
            expect(await USDC.balanceOf(admin.address)).eq(balanceBeforeFinish);
            expect(await USDT.balanceOf(admin.address)).eq(balanceBeforeFinishUSDT);

            
            
            for (let i = 0; i < participants; i++) {
                await ido.connect(users[i]).claimToken();
            }
        
    
            const balCrepe = (await crepeToken.balanceOf(ido.address)).div(parseEther('1'));
            const balUSDC = await USDC.balanceOf(ido.address);
            const balUSDT = await USDT.balanceOf(ido.address);

            console.log('************************************************************');
            
            console.log("*                 participants - ", participants + 6);
            console.log("Remaining Crepe on contract IDO: ", balCrepe.toString());

            
            participants += 1;
            // console.log("Remaining USDC on contract IDO:", balUSDC.toString());
            // console.log("Remaining USDT on contract IDO:", balUSDT.toString());
        
        }
    });

    
});
