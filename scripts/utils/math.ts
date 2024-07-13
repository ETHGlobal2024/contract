import { BigNumber, ethers } from 'ethers';

const Q96 = BigNumber.from(2).pow(96);

function toUint128(x: BigNumber): BigNumber {
  const maxUint128 = BigNumber.from(2).pow(128).sub(1);
  if (x.gt(maxUint128)) throw new Error('Value exceeds uint128 range');
  return x;
}

function mulDiv(a: BigNumber, b: BigNumber, denominator: BigNumber): BigNumber {
  return a.mul(b).div(denominator);
}

function getLiquidityForAmount0(sqrtRatioAX96: BigNumber, sqrtRatioBX96: BigNumber, amount0: BigNumber): BigNumber {
  if (sqrtRatioAX96.gt(sqrtRatioBX96)) [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  const intermediate = mulDiv(sqrtRatioAX96, sqrtRatioBX96, Q96);
  return toUint128(mulDiv(amount0, intermediate, sqrtRatioBX96.sub(sqrtRatioAX96)));
}

function getLiquidityForAmount1(sqrtRatioAX96: BigNumber, sqrtRatioBX96: BigNumber, amount1: BigNumber): BigNumber {
  if (sqrtRatioAX96.gt(sqrtRatioBX96)) [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  return toUint128(mulDiv(amount1, Q96, sqrtRatioBX96.sub(sqrtRatioAX96)));
}

function getLiquidityForAmounts(
  sqrtRatioX96: BigNumber,
  sqrtRatioAX96: BigNumber,
  sqrtRatioBX96: BigNumber,
  amount0: BigNumber,
  amount1: BigNumber
): BigNumber {
  if (sqrtRatioAX96.gt(sqrtRatioBX96)) [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];

  if (sqrtRatioX96.lte(sqrtRatioAX96)) {
    return getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0);
  } else if (sqrtRatioX96.lt(sqrtRatioBX96)) {
    const liquidity0 = getLiquidityForAmount0(sqrtRatioX96, sqrtRatioBX96, amount0);
    const liquidity1 = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioX96, amount1);
    return liquidity0.lt(liquidity1) ? liquidity0 : liquidity1;
  } else {
    return getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1);
  }
}

function getAmount0ForLiquidity(sqrtRatioAX96: BigNumber, sqrtRatioBX96: BigNumber, liquidity: BigNumber): BigNumber {
  if (sqrtRatioAX96.gt(sqrtRatioBX96)) [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];

  return mulDiv(
    liquidity.shl(2).div(Q96), sqrtRatioBX96.sub(sqrtRatioAX96), sqrtRatioBX96
  ).div(sqrtRatioAX96);
}

function getAmount1ForLiquidity(sqrtRatioAX96: BigNumber, sqrtRatioBX96: BigNumber, liquidity: BigNumber): BigNumber {
  if (sqrtRatioAX96.gt(sqrtRatioBX96)) [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];

  return mulDiv(liquidity, sqrtRatioBX96.sub(sqrtRatioAX96), Q96);
}

function getAmountsForLiquidity(
  sqrtRatioX96: BigNumber,
  sqrtRatioAX96: BigNumber,
  sqrtRatioBX96: BigNumber,
  liquidity: BigNumber
): [BigNumber, BigNumber] {
  if (sqrtRatioAX96.gt(sqrtRatioBX96)) [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];

  let amount0: BigNumber = BigNumber.from(0);
  let amount1: BigNumber = BigNumber.from(0);

  if (sqrtRatioX96.lte(sqrtRatioAX96)) {
    amount0 = getAmount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
  } else if (sqrtRatioX96.lt(sqrtRatioBX96)) {
    amount0 = getAmount0ForLiquidity(sqrtRatioX96, sqrtRatioBX96, liquidity);
    amount1 = getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioX96, liquidity);
  } else {
    amount1 = getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
  }

  return [amount0, amount1];
}
