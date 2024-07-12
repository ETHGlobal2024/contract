import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenv from "dotenv"
import {mainWallet, makeContract, sendTx, setupHRE} from "../utils/contract";
import hre from "hardhat";

dotenv.config();

export async function deploy(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const address = mainWallet().address;

  const [weth] = await makeContract("WETH9");
  const [usdt] = await makeContract("ERC20", "USDT", ["USDT", "USDT", "100000000000000000000000"]);

  // 设置controllerGasLimit参数，例如500000
  const controllerGasLimit = 500000;
  const [pm] = await makeContract("PoolManager", [controllerGasLimit]);
}

deploy(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
