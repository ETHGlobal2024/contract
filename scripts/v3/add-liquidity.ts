import {
  computePoolAddress,
  FeeAmount,
  MintOptions,
  NonfungiblePositionManager,
  Pool,
  Position,
  TICK_SPACINGS
} from '@uniswap/v3-sdk'
import {Percent, Token} from "@uniswap/sdk-core";
import {BigNumber, ethers} from 'ethers'
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {getContract, mainWallet, makeContract, setupHRE} from "../../utils/contract";
import hre from "hardhat";
import {calcSqrtPriceX96, price2Tick} from "./utils/math-utils";
import {approve} from "./utils/token-utils";
import {addLiquidity, createPool} from "./utils/pair-utils";

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const tokenA = await getContract("MockERC20", "EETH");
  const tokenB = await getContract("MockERC20", "USDe");

  console.log(`====== Add 1:5000 liquidity ======`)
  await addLiquidity(
    tokenA.address, tokenB.address, 4500, 5500,
    FeeAmount.MEDIUM, 5000,
    ethers.utils.parseEther("1"), ethers.utils.parseEther("5000")
  )

  console.log(`====== Add 1:? liquidity ======`)
  await addLiquidity(
    tokenA.address, tokenB.address, 4500, 5500,
    FeeAmount.MEDIUM, 5000,
    ethers.utils.parseEther("1")
  )

  console.log(`====== Add ?:5000 liquidity ======`)
  await addLiquidity(
    tokenA.address, tokenB.address, 4500, 5500,
    FeeAmount.MEDIUM, 5000,
    undefined, ethers.utils.parseEther("5000")
  )

  console.log(`====== Add 100000 liquidity ======`)
  await addLiquidity(
    tokenA.address, tokenB.address, 4500, 5500,
    FeeAmount.MEDIUM, 5000,
    undefined, undefined, ethers.utils.parseEther("100000")
  )
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
