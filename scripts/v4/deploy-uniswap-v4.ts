import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenv from "dotenv"
import {mainWallet, makeContract, sendTx, setupHRE} from "../../utils/contract";
import hre, {ethers} from "hardhat";

dotenv.config();

export async function deploy(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const address = mainWallet().address;

  const controllerGasLimit = 9999999999;
  const [pm] = await makeContract("PoolManager", [controllerGasLimit]);
  const [pr] = await makeContract("PoolReader", [pm.address]);
  // const [lc] = await makeContract("LiquidityCalculator");

  const [pml] = await makeContract("PoolModifyLiquidity", [pm.address]);
  const [ps] = await makeContract("PoolSwap", [pm.address]);

  // const [hook] = await makeContract("AIRangeHook", [pm.address]);
}

deploy(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
