import {BigNumber, Contract, ethers} from "ethers";
import {getContract, mainWallet, sendTx} from "../../../utils/contract";

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
