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
import {addLiquidity, createPool, getAmountOut} from "./utils/pair-utils";

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const tokenA_ = await getContract("MockERC20", "USDe");
  const tokenB_ = await getContract("MockERC20", "EETH");
  const fee = FeeAmount.MEDIUM;

  const amountIn = ethers.utils.parseEther("10");

  const tokenInAddress = tokenA_.address
  const tokenOutAddress = tokenB_.address

  const {
    token: tokenInContract, symbol: symbolIn, decimals: decimalsIn
  } = await fetchToken(tokenInAddress)
  const {
    symbol: symbolOut, decimals: decimalsOut
  } = await fetchToken(tokenOutAddress)

  const factory = await getContract('UniswapV3Factory')
  // const positionManager = await getContract('NonfungiblePositionManager')

  const tokenIn = new Token(chainId(), tokenInAddress, decimalsIn)
  const tokenOut = new Token(chainId(), tokenOutAddress, decimalsOut)

  const wallet = mainWallet()

  const tokenA = tokenIn < tokenOut ? tokenIn : tokenOut
  const tokenB = tokenIn < tokenOut ? tokenOut : tokenIn

  const currentPoolAddress = computePoolAddress({
    factoryAddress: factory.address, tokenA, tokenB, fee,
  })

  const poolContract = await saveContract('UniswapV3Pool', currentPoolAddress, `${symbolIn}-${symbolOut}`)

  const [liquidity, slot0] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  const pool = new Pool(
    tokenA, tokenB, fee, slot0.sqrtPriceX96.toString(),
    liquidity.toString(), slot0.tick
  )
  console.log(`Pool ${symbolIn}-${symbolOut} liquidity: ${ethers.utils.formatUnits(liquidity)}`, slot0)

  const swapRoute = new Route([pool], tokenIn, tokenOut)
  const amountOut = await getAmountOut(
    tokenInAddress, tokenOutAddress, amountIn, fee
  )

  console.log(`Amount in: ${ethers.utils.formatUnits(amountIn, decimalsIn)} ${symbolIn}`)
  console.log(`Amount out: ${ethers.utils.formatUnits(amountOut, decimalsOut)} ${symbolOut}`)
  console.log(`Price: ${ethers.utils.formatUnits(amountOut, decimalsOut)} ${symbolOut} / ${ethers.utils.formatUnits(amountIn, decimalsIn)} ${symbolIn} = ${
    ethers.utils.formatUnits(amountOut.mul(ethers.constants.WeiPerEther).div(amountIn), 18)} ${symbolOut}/${symbolIn} = ${
    ethers.utils.formatUnits(amountIn.mul(ethers.constants.WeiPerEther).div(amountOut), 18)} ${symbolIn}/${symbolOut}`)

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      tokenIn, amountIn.toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      tokenOut, amountOut.toString()
    ),
    tradeType: TradeType.EXACT_INPUT,
  })

  const swapRouter = await getContract('SwapRouter02')

  await approve(tokenInContract, swapRouter.address, amountIn)

  // const options: SwapOptions = {
  //   slippageTolerance: new Percent(100, 10_000), // 50 bips, or 0.50%
  //   deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
  //   recipient: wallet.address,
  // }

  // const {calldata, value} = SwapRouter.swapCallParameters([uncheckedTrade], options)

  // const MAX_FEE_PER_GAS = ethers.utils.parseUnits('100', 'gwei')
  // const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('10', 'gwei')

  // const tx = await wallet.sendTransaction({
  //   to: swapRouter.address, data: calldata, value,
  //   from: wallet.address,
  //   gasLimit: 3000000,
  //   // maxFeePerGas: MAX_FEE_PER_GAS,
  //   // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
  // })

  const swapParams = {
    tokenIn: tokenInAddress,
    tokenOut: tokenOutAddress,
    fee,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: wallet.address,
    amountIn: amountIn.toString(),
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0, // 设置为 0 表示不限制价格
  };

  const tx = await sendTx(swapRouter.exactInputSingle(swapParams, {
    gasLimit: 3000000, // 设置合适的 gas limit
  }), `Swap ${symbolIn} for ${symbolOut}`)
  await tx.wait()

  console.log(`Swapped ${symbolIn} for ${symbolOut}`)
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
