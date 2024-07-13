import {
  computePoolAddress,
  FeeAmount, MintOptions,
  NonfungiblePositionManager,
  Pool,
  Position,
  TICK_SPACINGS
} from "@uniswap/v3-sdk";
import {calcSqrtPriceX96, price2Tick} from "./math-utils";
import {chainId, getContract, mainWallet, makeContract, saveContract} from "../../../utils/contract";
import {Percent, Token} from "@uniswap/sdk-core";
import {BigNumber, ethers} from "ethers";
import {approve, fetchToken} from "./token-utils";

export async function createPool(
  tokenAAddress: string,
  tokenBAddress: string,
  fee: FeeAmount,
  initialPrice: number, // from tokenA to tokenB, for example 1 tokenA = 100 tokenB, initialPrice = 100
) {
  if (tokenAAddress > tokenBAddress)
    return createPool(tokenBAddress, tokenAAddress, fee, 1 / initialPrice)

  const {symbol: symbolA, decimals: decimalsA} = await fetchToken(tokenAAddress)
  const {symbol: symbolB, decimals: decimalsB} = await fetchToken(tokenBAddress)

  const wallet = mainWallet()
  const positionManager = await getContract('NonfungiblePositionManager')

  const tokenA = new Token(chainId(), tokenAAddress, decimalsA)
  const tokenB = new Token(chainId(), tokenBAddress, decimalsB)

  const sqrtPriceX96 = calcSqrtPriceX96(tokenAAddress, tokenBAddress, initialPrice)
  const tick = price2Tick(initialPrice)

  const configuredPool = new Pool(
    tokenA, tokenB, fee, sqrtPriceX96, 0, tick
  )

  console.log(`Creating pool with tokenA ${symbolA} and tokenB ${symbolB}, fee ${fee}, initial price ${initialPrice}`)

  const { calldata, value } = NonfungiblePositionManager.createCallParameters(configuredPool)
  const tx = await wallet.sendTransaction({ to: positionManager.address, data: calldata, value: value })
  await tx.wait()

  console.log(`Pool created with tx ${tx.hash}`)

  return configuredPool
}

export async function addLiquidity(
  tokenAAddress: string,
  tokenBAddress: string,
  priceLower: number,
  priceUpper: number,
  fee: FeeAmount,
  initialPrice: number,
  deltaAmountA?: BigNumber,
  deltaAmountB?: BigNumber,
  deltaLiquidity?: BigNumber,
) {
  if (tokenAAddress > tokenBAddress)
    return addLiquidity(tokenBAddress, tokenAAddress,
      1 / priceUpper, 1 / priceLower, fee,
      1 / initialPrice, deltaAmountB, deltaAmountA, deltaLiquidity)

  const {
    token: tokenAContract, symbol: symbolA, decimals: decimalsA
  } = await fetchToken(tokenAAddress)
  const {
    token: tokenBContract, symbol: symbolB, decimals: decimalsB
  } = await fetchToken(tokenBAddress)

  const tokenA = new Token(chainId(), tokenAAddress, decimalsA)
  const tokenB = new Token(chainId(), tokenBAddress, decimalsB)

  const wallet = mainWallet()

  const factory = await getContract('UniswapV3Factory')
  const positionManager = await getContract('NonfungiblePositionManager')

  const currentPoolAddress = computePoolAddress({
    factoryAddress: factory.address, tokenA, tokenB, fee,
  })

  const poolContract = await saveContract('UniswapV3Pool', currentPoolAddress, `${symbolA}-${symbolB}`)

  let liquidity = 0, slot0 = {} as any, configuredPool: Pool;
  try {
    [liquidity, slot0] = await Promise.all([ poolContract.liquidity(), poolContract.slot0() ])

    console.log(`Pool found with liquidity ${ethers.utils.formatUnits(liquidity)} and slot0:`, slot0)

    configuredPool = new Pool(
      tokenA, tokenB, fee, slot0.sqrtPriceX96.toString(),
      liquidity.toString(), slot0.tick
    )
  } catch (e) {
    console.log(`Pool not found, creating new pool`, e)

    configuredPool = await createPool(tokenAAddress, tokenBAddress, fee, initialPrice)
  }
  const tickSpacing = TICK_SPACINGS[fee]

  const tickLower: number = price2Tick(priceLower, tickSpacing)
  const tickUpper: number = price2Tick(priceUpper, tickSpacing)

  let position: Position, realDeltaAmountA: BigNumber, realDeltaAmountB: BigNumber;
  if (deltaAmountA && deltaAmountB) {
    position = Position.fromAmounts({
      pool: configuredPool,
      tickLower,
      tickUpper,
      amount0: deltaAmountA.toString(),
      amount1: deltaAmountB.toString(),
      useFullPrecision: true
    })
    realDeltaAmountA = deltaAmountA
    realDeltaAmountB = deltaAmountB

  } else if (deltaAmountA) {
    position = Position.fromAmount0({
      pool: configuredPool, tickLower, tickUpper,
      amount0: deltaAmountA.toString(),
      useFullPrecision: true
    })
    realDeltaAmountA = deltaAmountA
    realDeltaAmountB = ethers.utils.parseEther(position.amount1.toFixed())

  } else if (deltaAmountB) {
    position = Position.fromAmount1({
      pool: configuredPool, tickLower, tickUpper,
      amount1: deltaAmountB.toString()
    })
    realDeltaAmountA = ethers.utils.parseEther(position.amount0.toFixed())
    realDeltaAmountB = deltaAmountB

  } else if (deltaLiquidity) {
    position = new Position({
      pool: configuredPool, tickLower, tickUpper,
      liquidity: deltaLiquidity.toString(),
    })
    realDeltaAmountA = ethers.utils.parseEther(position.amount0.toFixed())
    realDeltaAmountB = ethers.utils.parseEther(position.amount1.toFixed())
  } else {
    throw new Error('Invalid parameters')
  }

  console.log(`Approving tokens: ${
    ethers.utils.formatUnits(realDeltaAmountA, decimalsA)
  } ${symbolA} and ${
    ethers.utils.formatUnits(realDeltaAmountB, decimalsB)
  } ${symbolB}`)

  await approve(tokenAContract, positionManager.address, realDeltaAmountA)
  await approve(tokenBContract, positionManager.address, realDeltaAmountB)

  console.log(`Adding liquidity to pool ${symbolA}-${symbolB} with tickLower ${tickLower} and tickUpper ${tickUpper}`)

  const mintOptions: MintOptions = {
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(100, 10_000),
  }

  const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions)

  const tx = await wallet.sendTransaction({ to: positionManager.address, data: calldata, value })
  await tx.wait()

  console.log(`Transaction hash: ${tx.hash}`)
}

export async function getAmountOut(
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: BigNumber,
  fee: FeeAmount,
) {
  const {symbol: symbolIn} = await fetchToken(tokenInAddress)
  const {symbol: symbolOut} = await fetchToken(tokenOutAddress)

  const quoter = await getContract('QuoterV2')
  const outData = await quoter.callStatic.quoteExactInputSingle({
    tokenIn: tokenInAddress, tokenOut: tokenOutAddress, fee, amountIn: amountIn.toString(), sqrtPriceLimitX96: 0
  })
  console.log(`Price for ${ethers.utils.formatUnits(amountIn)} ${symbolIn} is ${ethers.utils.formatUnits(outData.amountOut)} ${symbolOut}`, outData)

  return outData.amountOut
}

export async function getPoolInfo(
  tokenAAddress: string,
  tokenBAddress: string,
  fee: FeeAmount,
) {
  if (tokenAAddress > tokenBAddress)
    return getPoolInfo(tokenBAddress, tokenAAddress, fee)

  const { symbol: symbolA, decimals: decimalsA } = await fetchToken(tokenAAddress)
  const { symbol: symbolB, decimals: decimalsB } = await fetchToken(tokenBAddress)

  const factory = await getContract('UniswapV3Factory')

  const tokenA = new Token(chainId(), tokenAAddress, decimalsA)
  const tokenB = new Token(chainId(), tokenBAddress, decimalsB)

  const currentPoolAddress = computePoolAddress({
    factoryAddress: factory.address, tokenA, tokenB, fee,
  })

  const poolContract = await saveContract('UniswapV3Pool', currentPoolAddress, `${symbolA}-${symbolB}`)

  const [liquidity, slot0] =
    await Promise.all([
      poolContract.liquidity(),
      poolContract.slot0(),
    ])

  console.log(`Pool ${symbolA}-${symbolB} with fee ${fee} and liquidity ${liquidity} and slot0:`, slot0)
  return {
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1]
  }
}

export async function swap(

) {

}
