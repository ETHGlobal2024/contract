import {FeeAmount} from '@uniswap/v3-sdk'
import {ethers} from 'ethers'
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {getContract, mainWallet, makeContract, setupHRE} from "../../utils/contract";
import hre from "hardhat";
import {createPool, getAmountOut} from "./utils/pair-utils";

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const wallet = mainWallet()

  const tokenA = await getContract("MockERC20", "EETH");
  const tokenB = await getContract("MockERC20", "USDe");

  await getAmountOut(tokenA.address, tokenB.address,
    ethers.utils.parseEther("100"), FeeAmount.MEDIUM);

  await getAmountOut(tokenB.address, tokenA.address,
    ethers.utils.parseEther("100"), FeeAmount.MEDIUM);

  // await createPool(
  //   tokenA.address, tokenB.address, FeeAmount.MEDIUM, 5000
  // )
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
