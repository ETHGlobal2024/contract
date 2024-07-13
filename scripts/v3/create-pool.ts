import {FeeAmount} from '@uniswap/v3-sdk'
import {ethers} from 'ethers'
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {getContract, mainWallet, makeContract, setupHRE} from "../../utils/contract";
import hre from "hardhat";
import {createPool} from "./utils/pair-utils";

export async function main(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const wallet = mainWallet()
  const address = wallet.address;
  const chainId = hre.network.config.chainId

  const tokenA = await getContract("MockERC20", "USDC");
  const tokenB = await getContract("MockERC20", "EETH");

  await createPool(
    tokenA.address, tokenB.address, FeeAmount.MEDIUM, 5000
  )
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
