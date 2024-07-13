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
import {chainId, getContract, mainWallet, makeContract, provider, saveContract, setupHRE} from "../../utils/contract";
import hre from "hardhat";
import {calcSqrtPriceX96, price2Tick} from "./utils/math-utils";
import {approve, fetchToken} from "./utils/token-utils";
import {addLiquidity, createPool, getAmountOut} from "./utils/pair-utils";

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const tokenA_ = await getContract("MockERC20", "EETH");
  const tokenB_ = await getContract("MockERC20", "USDe");
  const fee = FeeAmount.MEDIUM;

  const amountIn = ethers.utils.parseEther("10");

  const tokenInAddress = tokenA_.address
  const tokenOutAddress = tokenB_.address

  const {
    token: tokenInContract, symbol: symbolA, decimals: decimalsA
  } = await fetchToken(tokenInAddress)
  const {
    token: tokenOutContract, symbol: symbolB, decimals: decimalsB
  } = await fetchToken(tokenOutAddress)

  const factory = await getContract('UniswapV3Factory')
  const positionManager = await getContract('NonfungiblePositionManager')

  const tokenIn = new Token(chainId(), tokenInAddress, decimalsA)
  const tokenOut = new Token(chainId(), tokenOutAddress, decimalsB)

  const wallet = mainWallet()

  const currentPoolAddress = computePoolAddress({
    factoryAddress: factory.address, tokenA: tokenIn, tokenB: tokenOut, fee,
  })

  const poolContract = await saveContract('UniswapV3Pool', currentPoolAddress, `${symbolA}-${symbolB}`)

  const [liquidity, slot0] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  const pool = new Pool(
    tokenIn, tokenOut, fee, slot0.sqrtPriceX96.toString(),
    liquidity.toString(), slot0.tick
  )
  console.log(`Pool ${symbolA}-${symbolB} liquidity: ${ethers.utils.formatUnits(liquidity)}`, slot0)

  const swapRoute = new Route([pool], tokenIn, tokenOut)
  const amountOut = await getAmountOut(
    tokenInAddress, tokenOutAddress, amountIn, fee
  )

  console.log(`Amount in: ${ethers.utils.formatUnits(amountIn, decimalsA)} ${symbolA}`)
  console.log(`Amount out: ${ethers.utils.formatUnits(amountOut, decimalsB)} ${symbolB}`)
  console.log(`Price: ${ethers.utils.formatUnits(amountOut, decimalsB)} ${symbolB} / ${ethers.utils.formatUnits(amountIn, decimalsA)} ${symbolA} = ${
    ethers.utils.formatUnits(amountOut.mul(ethers.constants.WeiPerEther).div(amountIn), 18)} ${symbolB}/${symbolA} = ${
    ethers.utils.formatUnits(amountIn.mul(ethers.constants.WeiPerEther).div(amountOut), 18)} ${symbolA}/${symbolB}`)

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      tokenIn, amountIn.toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      tokenOut, amountOut
    ),
    tradeType: TradeType.EXACT_INPUT,
  })

  const options: SwapOptions = {
    slippageTolerance: new Percent(100, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: wallet.address,
  }

  const {calldata, value} = SwapRouter.swapCallParameters([uncheckedTrade], options)

  const swapRouter = await getContract('SwapRouter')

  await approve(tokenInContract, swapRouter.address, amountIn)

  const tx = await wallet.sendTransaction({
    to: swapRouter.address, data: calldata, value
  })
  await tx.wait()

  console.log(`Swapped ${symbolA} for ${symbolB}`)
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
