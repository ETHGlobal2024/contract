import {
  computePoolAddress,
  FeeAmount,
  MintOptions,
  NonfungiblePositionManager,
  Pool,
  Position, Route, SwapOptions, SwapQuoter, SwapRouter,
  TICK_SPACINGS, Trade
} from '@uniswap/v3-sdk'
import {CurrencyAmount, Percent, Token, TradeType} from "@uniswap/sdk-core";
import {BigNumber, ethers} from 'ethers'
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {
  chainId,
  getContract,
  mainWallet,
  makeContract,
  provider,
  saveContract,
  sendTx,
  setupHRE
} from "../../utils/contract";
import hre from "hardhat";
import {calcSqrtPriceX96, price2Tick} from "./utils/math-utils";
import {approve, fetchToken} from "./utils/token-utils";
import {addLiquidity, createPool, getAmountOut, swap} from "./utils/pair-utils";

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const tokenA = await getContract("MockERC20", "USDe");
  const tokenB = await getContract("MockERC20", "EETH");
  const fee = FeeAmount.MEDIUM;

  const amountIn = ethers.utils.parseEther("100000");

  await swap(tokenA.address, tokenB.address, fee, amountIn);
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
