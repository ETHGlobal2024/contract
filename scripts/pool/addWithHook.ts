import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenv from "dotenv"
import {getContract, mainWallet, makeContract, sendTx, setupHRE} from "../../utils/contract";
import hre, {ethers} from "hardhat";
import {addLiquidity, addLiquidityWithHook, initializePool} from "../utils/router";
import {getPairInfoWithOwner} from "../utils/info";

dotenv.config();

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const address = mainWallet().address;

  const tokenA = await getContract("MockERC20", "EETH");
  const tokenB = await getContract("MockERC20", "USDC");

  const tokenAAmount = ethers.utils.parseEther("1");
  const tokenBAmount = ethers.utils.parseEther("5000");

  await addLiquidityWithHook(
    tokenA.address, tokenB.address, tokenAAmount, tokenBAmount
  );
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
