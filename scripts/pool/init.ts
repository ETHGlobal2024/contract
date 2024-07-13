import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenv from "dotenv"
import {getContract, mainWallet, makeContract, sendTx, setupHRE} from "../../utils/contract";
import hre, {ethers} from "hardhat";
import {initializePool} from "../utils/router";

dotenv.config();

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const tokenA = await getContract("MockERC20", "EETH");
  const tokenB = await getContract("MockERC20", "USDe");

  // const hook = await getContract("AIRangeHook");

  // await initializePool(tokenA.address, tokenB.address,
  //   5000, 3000, 60, hook.address);
  await initializePool(tokenA.address, tokenB.address, 5000);
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
