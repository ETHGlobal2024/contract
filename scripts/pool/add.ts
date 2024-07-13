import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenv from "dotenv"
import {getContract, mainWallet, makeContract, sendTx, setupHRE} from "../../utils/contract";
import hre, {ethers} from "hardhat";
import {addLiquidity, initializePool} from "../utils/router";
import {getPairInfoWithOwner} from "../utils/info";

dotenv.config();

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const address = mainWallet().address;

  const tokenA = await getContract("MockERC20", "EETH");
  const tokenB = await getContract("MockERC20", "USDC");

  // const priceUpper = 5500;
  // const priceLower = 4500;

  const tickLower = 84120;
  const tickUpper = 86100;
  // const tickLower = -120;
  // const tickUpper = 120;
  const delta = ethers.utils.parseEther("10000");

  await getPairInfoWithOwner(tokenA.address, tokenB.address, address, tickLower, tickUpper);

  await addLiquidity(
    tokenA.address, tokenB.address, tickLower, tickUpper, delta
  );

  await getPairInfoWithOwner(tokenA.address, tokenB.address, address, tickLower, tickUpper);
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
