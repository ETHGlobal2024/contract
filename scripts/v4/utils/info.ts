import {BigNumber, Contract, ethers} from 'ethers';
import {getContract, hre, mainWallet, saveContract, sendTx} from "../../../utils/contract";
import {fetchToken, getPoolId, getPoolKey, ZeroAddress} from "./router";

const MIN_TICK = -887272;
const MAX_TICK = 887272;

export async function getPairInfo(tokenAAddress: string, tokenBAddress: string,
                                  minTick = -100, maxTick = 100,
                                  fee = 3000, tickSpacing = 60, hooks = ZeroAddress) {

  const {token: tokenA, symbol: symbolA} = await fetchToken(tokenAAddress);
  const {token: tokenB, symbol: symbolB} = await fetchToken(tokenBAddress);

  const poolKey = getPoolKey(tokenAAddress, tokenBAddress, fee, tickSpacing, hooks);
  const poolId = getPoolId(poolKey);

  const pm = await getContract("PoolManager");
  const pr = await getContract("PoolReader");

  try {
    console.log(`==== ${symbolA}${symbolB} Pair Info: ${poolId} ====`)

    const liquidity = await pr.getLiquidity(poolId as any);
    console.log(`Liquidity: ${ethers.utils.formatUnits(liquidity)}`)

    for (let tick = minTick; tick < maxTick; tick += tickSpacing) {
      const liquidityAtTick = await pr.getTickLiquidity(poolId as any, tick);
      console.log(`Liquidity at tick ${tick}: ${ethers.utils.formatUnits(liquidityAtTick)}`)
    }

    const tokenAReserve = await tokenA.balanceOf(pr);
    const tokenBReserve = await tokenB.balanceOf(pr);

    console.log(`${symbolA} Reserve: ${ethers.utils.formatUnits(tokenAReserve)}`)
    console.log(`${symbolB} Reserve: ${ethers.utils.formatUnits(tokenBReserve)}`)

  } catch (e) {
    console.log(`Pair does not exist yet`, e)
  }

}

export async function getPairInfoWithOwner(tokenAAddress: string, tokenBAddress: string,
                                           owner: string, tickLower: number, tickUpper: number,
                                           minTick = -100, maxTick = 100,
                                           fee = 3000, tickSpacing = 60, hooks = ZeroAddress) {

  const {token: tokenA, symbol: symbolA} = await fetchToken(tokenAAddress);
  const {token: tokenB, symbol: symbolB} = await fetchToken(tokenBAddress);

  const poolKey = getPoolKey(tokenAAddress, tokenBAddress, fee, tickSpacing, hooks);
  const poolId = getPoolId(poolKey);

  const pm = await getContract("PoolManager");
  const pr = await getContract("PoolReader");
  const pml = await getContract("PoolModifyLiquidity");
  const ps = await getContract("PoolSwap");

  try {
    console.log(`==== ${symbolA}${symbolB} Pair Info: ${poolId} ====`)

    const liquidity = await pr.getLiquidity(poolId as any);
    console.log(`Liquidity: ${ethers.utils.formatUnits(liquidity)}`)

    // for (let tick = minTick; tick < maxTick; tick += tickSpacing) {
    //   const liquidityAtTick = await pr.getTickLiquidity(poolId as any, tick);
    //   console.log(`Liquidity at tick ${tick}: ${ethers.utils.formatUnits(liquidityAtTick)}`)
    // }

    const position = await pr.getPosition(
      poolId as any, owner, tickLower, tickUpper,
      ethers.utils.hexZeroPad('0x0', 32)
    );
    console.log(`Position for ${owner} at tick (${tickLower}, ${tickUpper}): `, position)

    const tokenAReserve = await tokenA.balanceOf(pml.address);
    const tokenBReserve = await tokenB.balanceOf(pml.address);

    console.log(`${symbolA} Reserve: ${ethers.utils.formatUnits(tokenAReserve)}`)
    console.log(`${symbolB} Reserve: ${ethers.utils.formatUnits(tokenBReserve)}`)

    const tokenABalance = await tokenA.balanceOf(owner);
    const tokenBBalance = await tokenB.balanceOf(owner);

    console.log(`${symbolA} Balance: ${ethers.utils.formatUnits(tokenABalance)}`)
    console.log(`${symbolB} Balance: ${ethers.utils.formatUnits(tokenBBalance)}`)

  } catch (e) {
    console.log(`Pair does not exist yet`, e)
  }

}
