import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenv from "dotenv"
import {getContract, makeContract, sendTx, setupHRE} from "../utils/contract";
import hre from "hardhat";
import {ethers} from "ethers";
import {mainWallet} from "../utils/contract";

dotenv.config();

export async function withdraw(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const address = mainWallet().address;

  const weth = await getContract("WETH");

  const value = weth.balanceOf(address);

  console.log(`Wrapping ${ethers.utils.formatUnits(value, 18)} WETH`);

  const oldBalance = await hre.ethers.provider.getBalance(address);
  const oldWETHBalance = await weth.balanceOf(address);

  console.log(`Old: ${ethers.utils.formatUnits(oldBalance, 18)} ETH + ${ethers.utils.formatUnits(oldWETHBalance, 18)} WETH`);

  await sendTx(weth.withdraw(value), `weth.withdraw(${value})`, 0)

  const newBalance = await hre.ethers.provider.getBalance(address);
  const newWETHBalance = await weth.balanceOf(address);

  console.log(`New: ${ethers.utils.formatUnits(newBalance, 18)} ETH + ${ethers.utils.formatUnits(newWETHBalance, 18)} WETH`);
}

withdraw(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
