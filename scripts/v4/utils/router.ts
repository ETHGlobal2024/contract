import {BigNumber, Contract, ethers} from 'ethers';
import {getContract, mainWallet, sendTx} from "../../../utils/contract";
import {parseUnits} from "ethers/lib/utils";

export const ZeroAddress = "0x0000000000000000000000000000000000000000"

export async function approve(token: Contract, address: string, spenderAddress: string, amount: BigNumber) {
  const symbol = await token.symbol();
  if (BigNumber.from(await token.allowance(mainWallet().address, spenderAddress)).lt(amount)) {
    console.log(`Approving ${ethers.utils.formatUnits(amount)} of ${symbol} to ${spenderAddress}`);
    await sendTx(token.approve(spenderAddress, amount), `tokenContract.approve(${spenderAddress}, ${amount})`);
  }
}
export async function fetchToken(tokenAddress: string) {
  const token = await getContract('MockERC20', 'ERC20', tokenAddress);
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();

  console.log(`Token ${name}(${symbol}) at ${tokenAddress} with decimals ${decimals}`);
  return {token, name, symbol, decimals};
}

export type PoolKey = {
  currency0: string,
  currency1: string,
  fee: number,
  tickSpacing: number,
  hooks: string
}

export function getPoolKey(tokenAAddress: string, tokenBAddress: string,
                           fee = 3000, tickSpacing = 60, hooks = ZeroAddress) {
  return {
    currency0: tokenAAddress < tokenBAddress ? tokenAAddress : tokenBAddress,
    currency1: tokenAAddress < tokenBAddress ? tokenBAddress : tokenAAddress,
    fee, tickSpacing, hooks
  };
}

// Function to convert PoolKey to PoolId
export function getPoolId(poolKeyOrTokenAAddress: PoolKey | string, tokenBAddress?: string,
                          fee = 3000, tickSpacing = 60, hooks = ZeroAddress): string {
  if (typeof poolKeyOrTokenAAddress === 'string')
    return getPoolId(getPoolKey(poolKeyOrTokenAAddress, tokenBAddress, fee, tickSpacing, hooks));

  const poolKey = poolKeyOrTokenAAddress;

  const abiCoder = new ethers.utils.AbiCoder();

  // Encode the poolKey as bytes
  const encodedPoolKey = abiCoder.encode(
    ['address', 'address', 'uint24', 'int24', 'address'],
    [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
  );

  // Compute the keccak256 hash of the encoded poolKey
  return ethers.utils.keccak256(encodedPoolKey);
}

export function number2Str(num: number): string {
  return num.toPrecision(Math.ceil(Math.log10(num)))
}

export function calcSqrtPriceX96(
  tokenAAddress: string, tokenBAddress: string,
  initialPrice: number): BigNumber {
  // const precision = 10^18;

  // 5585585457255635800344848498688
  // 5602277097478614198912276234240
  if (tokenAAddress < tokenBAddress) {
    console.log(`${initialPrice} -> ${number2Str(Math.sqrt(initialPrice) * (2 ** 96))}`);

    return BigNumber.from(number2Str(Math.sqrt(initialPrice) * (2 ** 96)));
  } else {
    console.log(`${initialPrice} -> ${number2Str(Math.sqrt(1 / initialPrice) * (2 ** 96))}`);

    return BigNumber.from(number2Str(Math.sqrt(1 / initialPrice) * (2 ** 96)));
  }
}

export async function initializePool(
  tokenAAddress: string, tokenBAddress: string,
  initialPrice: number, // 1 tokenA = ? tokenB
  fee = 3000, tickSpacing = 60, hooks = ZeroAddress, hookData = "0x"
) {
  const pm = await getContract('PoolManager');
  const poolKey = getPoolKey(tokenAAddress, tokenBAddress, fee, tickSpacing, hooks);
  const sqrtPriceX96 = calcSqrtPriceX96(tokenAAddress, tokenBAddress, initialPrice);

  console.log(`Initializing pool ${poolKey.currency0}-${poolKey.currency1} with sqrtPriceX96 ${sqrtPriceX96}`);

  await sendTx(pm.initialize(poolKey, sqrtPriceX96, hookData, {
    gasLimit: 1000000
  }), `pm.initialize(${JSON.stringify(poolKey)}, ${sqrtPriceX96}, ${hookData})`);
}

export async function addLiquidity(
  tokenAAddress: string,
  tokenBAddress: string,
  tickLower: number,
  tickUpper: number,
  liquidityDelta: BigNumber,
  // owner = mainWallet().address,
  fee = 3000,
  tickSpacing = 60,
  hooks = ZeroAddress,
  hookData = "0x"
) {
  const pm = await getContract('PoolModifyLiquidity');
  const poolKey = getPoolKey(tokenAAddress, tokenBAddress, fee, tickSpacing, hooks);

  const tokenA = await fetchToken(tokenAAddress);
  const tokenB = await fetchToken(tokenBAddress);

  await approve(tokenA.token, pm.address, pm.address, await tokenA.token.totalSupply());
  await approve(tokenB.token, pm.address, pm.address, await tokenB.token.totalSupply());

  const liquidityParams = {
    // owner,
    tickLower,
    tickUpper,
    liquidityDelta,
    // tickSpacing,
    salt: ethers.utils.hexZeroPad('0x0', 32)
  };

  console.log(`Adding liquidity to pool ${poolKey.currency0}-${poolKey.currency1} with params ${JSON.stringify(liquidityParams)}`);

  await sendTx(pm["modifyLiquidity((address,address,uint24,int24,address),(int24,int24,int256,bytes32),bytes)"](poolKey, liquidityParams, hookData),
    `pm.modifyLiquidity(${JSON.stringify(poolKey)}, ${JSON.stringify(liquidityParams)}, ${hookData})`);
}

export async function addLiquidityWithHook(
  tokenAAddress: string,
  tokenBAddress: string,
  amount0Desired: BigNumber,
  amount1Desired: BigNumber,
  amount0Min: BigNumber = BigNumber.from(0),
  amount1Min: BigNumber = BigNumber.from(0),
  to = mainWallet().address,
  deadline = 9999999999999,
  fee = 3000,
  tickSpacing = 60,
  hooks = ZeroAddress,
  hookData = "0x"
) {
  const hook = await getContract('AIRangeHook');
  const poolKey = getPoolKey(tokenAAddress, tokenBAddress, fee, tickSpacing, hooks);

  const tokenA = await fetchToken(tokenAAddress);
  const tokenB = await fetchToken(tokenBAddress);

  await approve(tokenA.token, hook.address, hook.address, await tokenA.token.totalSupply());
  await approve(tokenB.token, hook.address, hook.address, await tokenB.token.totalSupply());

  const addParams = {
    currency0: poolKey.currency0,
    currency1: poolKey.currency1,
    amount0Desired, amount1Desired, amount0Min, amount1Min,
    fee: poolKey.fee, to, deadline
  };

  await sendTx(hook.addLiquidity(addParams), `hook.addLiquidity(${JSON.stringify(addParams)})`);
}

export async function removeLiquidity(
  tokenAAddress: string,
  tokenBAddress: string,
  tickLower: number,
  tickUpper: number,
  liquidityDelta: BigNumber,
  // owner = mainWallet().address,
  fee = 3000,
  tickSpacing = 60,
  hooks = ZeroAddress,
  hookData = "0x"
) {
  const pm = await getContract('PoolModifyLiquidity');
  const poolKey = getPoolKey(tokenAAddress, tokenBAddress, fee, tickSpacing, hooks);

  const liquidityParams = {
    // owner,
    tickLower,
    tickUpper,
    liquidityDelta: -liquidityDelta,
    // tickSpacing,
    salt: ethers.utils.hexZeroPad('0x0', 32)
  };

  console.log(`Removing liquidity from pool ${poolKey.currency0}-${poolKey.currency1} with params ${liquidityParams}`);

  await sendTx(pm["modifyLiquidity((address,address,uint24,int24,address),(int24,int24,int256,bytes32),bytes)"](poolKey, liquidityParams, hookData),
    `pm.modifyLiquidity(${JSON.stringify(poolKey)}, ${JSON.stringify(liquidityParams)}, ${hookData})`);
}

export async function swap(
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: BigNumber,
  amountOutMin: BigNumber,
  fee = 3000,
  tickSpacing = 60,
  hooks = ZeroAddress,
  hookData = "0x"
) {
  const pm = await getContract('PoolSwap');
  const poolKey = getPoolKey(tokenInAddress, tokenOutAddress, fee, tickSpacing, hooks);

  const tokenIn = await fetchToken(tokenInAddress);
  const tokenOut = await fetchToken(tokenOutAddress);

  await approve(tokenIn.token, pm.address, pm.address, amountIn);

  const swapParams = {
    zeroForOne: tokenInAddress < tokenOutAddress,
    amountSpecified: amountIn,
    sqrtPriceLimitX96: 0
  };

  const balanceDelta = await pm.swap(poolKey, swapParams, hookData);
  console.log(`Swapped ${ethers.utils.formatUnits(amountIn)} ${tokenIn.symbol} for ${ethers.utils.formatUnits(balanceDelta)} ${tokenOut.symbol}`);

  if (BigNumber.from(balanceDelta).lt(amountOutMin)) {
    throw new Error('Insufficient output amount');
  }
}
