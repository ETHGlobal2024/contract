import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenv from "dotenv"
import {mainWallet, makeContract, sendTx, setupHRE} from "../../utils/contract";
import hre, {ethers} from "hardhat";
import {addLiquidity, initializePool} from "./utils/router";
import {getPairInfoWithOwner} from "./utils/info";

dotenv.config();

export async function deploy(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const address = mainWallet().address;

  const controllerGasLimit = 9999999999;
  const [pm] = await makeContract("PoolManager", [controllerGasLimit]);
  const [pr] = await makeContract("PoolReader", [pm.address]);
  // const [lc] = await makeContract("LiquidityCalculator");

  const [pml] = await makeContract("PoolModifyLiquidity", [pm.address]);
  // const [ps] = await makeContract("PoolSwap", [pm.address]);

  const [usdc] = await makeContract("MockERC20", "USDC", ["USD Coin", "USDC", ethers.utils.parseEther("100000000000")]);
  const [ezeth] = await makeContract("MockERC20", "EZETH", ["Renzo Restaked ETH", "EZETH", ethers.utils.parseEther("100000000000")]);

  await initializePool(ezeth.address, usdc.address, 5000);

  const tickLower = 84120;
  const tickUpper = 86100;
  // const tickLower = -120;
  // const tickUpper = 120;
  const delta = ethers.utils.parseEther("10000");

  await getPairInfoWithOwner(ezeth.address, usdc.address, address, tickLower, tickUpper);

  await addLiquidity(
    ezeth.address, usdc.address, tickLower, tickUpper, delta
  );

  await getPairInfoWithOwner(ezeth.address, usdc.address, address, tickLower, tickUpper);
}

deploy(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
