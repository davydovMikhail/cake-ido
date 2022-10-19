import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import * as mocha from "mocha-steps";
import { parseEther } from '@ethersproject/units';
import { Exchanger, IERC20Metadata, TokenERC20 } from '../typechain-types';

describe("Exchanger test", async () => {
    let exchanger: Exchanger, crepeToken: TokenERC20, lkCrepeToken: TokenERC20;
    let admin: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, 
    user3: SignerWithAddress, user4: SignerWithAddress, user5: SignerWithAddress, remainsRecipient: SignerWithAddress;

    beforeEach(async () => {
        [admin, user1, user2, user3, user4, user5, remainsRecipient] = await ethers.getSigners();
    });

    mocha.step("Deploying Crepe and LKCrepe tokens", async function () {
        const tokenF = await ethers.getContractFactory("TokenERC20");
        const totalSupply = parseEther('1000000');
        crepeToken = await tokenF.connect(admin).deploy("CREPE Coin", "CREPE", totalSupply);
        lkCrepeToken = await tokenF.connect(admin).deploy('LKCREPE', 'LKCREPE', totalSupply);
    });

    mocha.step("Transfer LKCrepe to users", async function () {
        await lkCrepeToken.connect(admin).transfer(user1.address, parseEther('10000'));
        await lkCrepeToken.connect(admin).transfer(user2.address, parseEther('11000'));
        await lkCrepeToken.connect(admin).transfer(user3.address, parseEther('9000'));
        await lkCrepeToken.connect(admin).transfer(user4.address, parseEther('12000'));
        await lkCrepeToken.connect(admin).transfer(user5.address, parseEther('8000'));
    });

    mocha.step("Deploying Exchanger contract", async function () {
        const Exchanger = await ethers.getContractFactory("Exchanger");
        exchanger = await Exchanger.connect(admin).deploy(crepeToken.address, lkCrepeToken.address, remainsRecipient.address);
    });

    mocha.step("Transfer Crepe to exchanger", async function () {
        await crepeToken.connect(admin).transfer(exchanger.address, parseEther('70000'));
    });

    mocha.step('Approve LKCREPE to exchanger', async function () {
        await lkCrepeToken.connect(user1).approve(exchanger.address, parseEther('10000'))
        await lkCrepeToken.connect(user2).approve(exchanger.address, parseEther('11000'))
        await lkCrepeToken.connect(user3).approve(exchanger.address, parseEther('9000'))
        await lkCrepeToken.connect(user4).approve(exchanger.address, parseEther('12000'))
        await lkCrepeToken.connect(user5).approve(exchanger.address, parseEther('8000'))
    });

    mocha.step("Checking balance Crepe token before swap", async function () {
        expect(await crepeToken.balanceOf(user1.address)).to.equal(0);
        expect(await crepeToken.balanceOf(user2.address)).to.equal(0);
        expect(await crepeToken.balanceOf(user3.address)).to.equal(0);
        expect(await crepeToken.balanceOf(user4.address)).to.equal(0);
        expect(await crepeToken.balanceOf(user5.address)).to.equal(0);
    });

    mocha.step("Checking balance LKCREPE token before swap", async function () {
        expect(await lkCrepeToken.balanceOf(user1.address)).to.equal(parseEther('10000'));
        expect(await lkCrepeToken.balanceOf(user2.address)).to.equal(parseEther('11000'));
        expect(await lkCrepeToken.balanceOf(user3.address)).to.equal(parseEther('9000'));
        expect(await lkCrepeToken.balanceOf(user4.address)).to.equal(parseEther('12000'));
        expect(await lkCrepeToken.balanceOf(user5.address)).to.equal(parseEther('8000'));
    });

    mocha.step("Swap LKCREPE to Crepe", async function () {
        await exchanger.connect(user1).swap(parseEther('10000'));
        await exchanger.connect(user2).swap(parseEther('11000'));
        await exchanger.connect(user3).swap(parseEther('9000'));
        await exchanger.connect(user4).swap(parseEther('12000'));
        await exchanger.connect(user5).swap(parseEther('8000'));
    });

    mocha.step("Atempt swap 0 coins", async function () {
        await expect(exchanger.connect(user1).swap(0)).to.be.revertedWith('The amount must be greater than zero.');
    });

    mocha.step("Checking balance Crepe token after swap", async function () {
        expect(await crepeToken.balanceOf(user1.address)).to.equal(parseEther('10000'));
        expect(await crepeToken.balanceOf(user2.address)).to.equal(parseEther('11000'));
        expect(await crepeToken.balanceOf(user3.address)).to.equal(parseEther('9000'));
        expect(await crepeToken.balanceOf(user4.address)).to.equal(parseEther('12000'));
        expect(await crepeToken.balanceOf(user5.address)).to.equal(parseEther('8000'));
    });

    mocha.step("Checking balance LKCREPE token after swap", async function () {
        expect(await lkCrepeToken.balanceOf(user1.address)).to.equal(0);
        expect(await lkCrepeToken.balanceOf(user2.address)).to.equal(0);
        expect(await lkCrepeToken.balanceOf(user3.address)).to.equal(0);
        expect(await lkCrepeToken.balanceOf(user4.address)).to.equal(0);
        expect(await lkCrepeToken.balanceOf(user5.address)).to.equal(0);
    });

    mocha.step("Checking balances remainsRecipient before withdrawal", async function () {
        expect(await lkCrepeToken.balanceOf(remainsRecipient.address)).to.equal(0);
        expect(await crepeToken.balanceOf(remainsRecipient.address)).to.equal(0);
    });

    mocha.step('Call withdrawal Crepe and LKCREPE', async function () {
        await exchanger.connect(admin).withdrawal();
    });

    mocha.step("Checking balances remainsRecipient after withdrawal", async function () {
        expect(await lkCrepeToken.balanceOf(remainsRecipient.address)).to.equal(parseEther('50000'));
        expect(await crepeToken.balanceOf(remainsRecipient.address)).to.equal(parseEther('20000'));
    });
})