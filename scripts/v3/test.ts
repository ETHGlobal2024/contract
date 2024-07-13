import {
  computePoolAddress,
  FeeAmount,
  MintOptions,
  NonfungiblePositionManager,
  Pool,
  Position,
  TICK_SPACINGS
} from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import {Percent, Token} from "@uniswap/sdk-core";
import {ethers, BigNumber, Contract} from 'ethers'
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {getContract, mainWallet, makeContract, sendTx, setupHRE} from "../../utils/contract";
import hre from "hardhat";
import {getAmountOut} from "./utils/pair-utils";

export function number2Str(num: number): string {
  return num.toPrecision(Math.ceil(Math.log10(num)))
}

export function calcSqrtPriceX96(
  tokenAAddress: string, tokenBAddress: string,
  initialPrice: number) {
  return number2Str(Math.sqrt(initialPrice) * (2 ** 96));
}

export function price2Tick(price: number, tickSpacing = 1) {
  return Math.floor(Math.log(price) / Math.log(1.0001) / tickSpacing) * tickSpacing;
}

export async function approve(token: Contract, spenderAddress: string, amount: BigNumber) {
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

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const tokenA = await getContract("MockERC20", "EETH");
  const tokenB = await getContract("MockERC20", "USDe");

  await getAmountOut(tokenA.address, tokenB.address,
    ethers.utils.parseEther("100"), FeeAmount.MEDIUM);

  await getAmountOut(tokenB.address, tokenA.address,
    ethers.utils.parseEther("1"), FeeAmount.MEDIUM);

  // const wallet = mainWallet()
  // const address = wallet.address;
  // const chainId = hre.network.config.chainId
  //
  // const [usdt] = await makeContract("MockERC20", "USDT", ["Tether", "USDT", ethers.utils.parseEther("100000000000")]);
  // const [eeth] = await makeContract("MockERC20", "EETH", ["ether.fi Staked ETH", "EETH", ethers.utils.parseEther("100000000000")]);
  //
  // const usdtBalance = await usdt.balanceOf(address);
  // console.log(`USDT balance: ${ethers.utils.formatUnits(usdtBalance)}`);
  //
  // const eethBalance = await eeth.balanceOf(address);
  // console.log(`EETH balance: ${ethers.utils.formatUnits(eethBalance)}`);
  //
  // const factory = await getContract('UniswapV3Factory')
  // const positionManager = await getContract('NonfungiblePositionManager')
  //
  // const usdtToken = new Token(chainId, usdt.address, 18)
  // const eethToken = new Token(chainId, eeth.address, 18)
  //
  // const price = 5000, poolFee = FeeAmount.MEDIUM, tickSpacing = TICK_SPACINGS[poolFee]
  //
  // const currentPoolAddress = computePoolAddress({
  //   factoryAddress: factory.address,
  //   tokenA: usdtToken,
  //   tokenB: eethToken,
  //   fee: poolFee,
  // })
  //
  // const pool = await getContract('UniswapV3Pool', currentPoolAddress, currentPoolAddress)
  //
  // let liquidity = BigNumber.from(10), slot0 = {} as any, configuredPool: Pool;
  // try {
  //   [liquidity, slot0] = await Promise.all([ pool.liquidity(), pool.slot0() ])
  //
  //   console.log(`Pool found with liquidity ${ethers.utils.formatUnits(liquidity)} and slot0 ${JSON.stringify(slot0)}`)
  //
  //   configuredPool = new Pool(
  //     usdtToken, eethToken, poolFee, slot0.sqrtPriceX96?.toString(),
  //     liquidity.toString(), slot0.tick
  //   )
  //
  // } catch (e) {
  //   console.log(`Pool not found, creating new pool`, e)
  //
  //   const sqrtPriceX96 = calcSqrtPriceX96(usdt.address, eeth.address, price)
  //
  //   configuredPool = new Pool(
  //     usdtToken, eethToken, poolFee, sqrtPriceX96,
  //     liquidity.toString(), price2Tick(price)
  //   )
  //
  //   const { calldata, value } = NonfungiblePositionManager.createCallParameters(configuredPool)
  //   const tx = await wallet.sendTransaction({ to: positionManager.address, data: calldata, value: value })
  //
  //   console.log(`Transaction hash: ${tx.hash}`)
  // }
  //
  // const amountUSDT = ethers.utils.parseEther("1")
  // const amountEETH = ethers.utils.parseEther("5000")
  //
  // await approve(usdt, positionManager.address, amountUSDT)
  // await approve(eeth, positionManager.address, amountEETH)
  //
  // // const pool = new Pool(usdtToken, eethToken, poolFee, JSBI.BigInt(sqrtPriceX96), JSBI.BigInt('0'), 0)
  // const priceLower: number = 4500
  // const priceUpper: number = 5500
  //
  // const tickLower: number = price2Tick(priceLower, tickSpacing)
  // const tickUpper: number = price2Tick(priceUpper, tickSpacing)
  //
  // const position = Position.fromAmounts({
  //   pool: configuredPool,
  //   tickLower,
  //   tickUpper,
  //   amount0: amountUSDT.toString(),
  //   amount1: amountEETH.toString(),
  //   useFullPrecision: true
  // })
  //
  // // const position = new Position({
  // //   pool: configuredPool, liquidity: liquidity.toString(), tickLower, tickUpper
  // // })
  //
  // const mintOptions: MintOptions = {
  //   recipient: address,
  //   deadline: Math.floor(Date.now() / 1000) + 60 * 20,
  //   slippageTolerance: new Percent(50, 10_000),
  // }
  //
  // const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions)
  //
  // const tx = await wallet.sendTransaction({ to: positionManager.address, data: calldata, value: value })
  //
  // console.log(`Transaction hash: ${tx.hash}`)
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
