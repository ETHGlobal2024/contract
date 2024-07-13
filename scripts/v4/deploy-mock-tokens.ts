import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenv from "dotenv"
import {mainWallet, makeContract, sendTx, setupHRE} from "../../utils/contract";
import hre, {ethers} from "hardhat";

dotenv.config();

export async function deploy(hre: HardhatRuntimeEnvironment) {
  setupHRE(hre);

  const address = mainWallet().address;

  const [weth] = await makeContract("WETH");

  const [usdt] = await makeContract("MockERC20", "USDT", ["Tether", "USDT", ethers.utils.parseEther("100000000000")]);
  const [usdc] = await makeContract("MockERC20", "USDC", ["USD Coin", "USDC", ethers.utils.parseEther("100000000000")]);
  const [ezeth] = await makeContract("MockERC20", "EZETH", ["Renzo Restaked ETH", "EZETH", ethers.utils.parseEther("100000000000")]);
  const [usde] = await makeContract("MockERC20", "USDe", ["Ethena USDe", "USDe", ethers.utils.parseEther("100000000000")]);
  const [eeth] = await makeContract("MockERC20", "EETH", ["ether.fi Staked ETH", "EETH", ethers.utils.parseEther("100000000000")]);
}

deploy(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
