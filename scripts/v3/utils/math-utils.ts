export function number2Str(num: number): string {
  return num.toPrecision(Math.ceil(Math.log10(num)))
}

export function calcSqrtPriceX96(
  tokenAAddress: string, tokenBAddress: string,
  initialPrice: number) {
  return number2Str(Math.sqrt(initialPrice) * (2 ** 96));
  // if (tokenAAddress < tokenBAddress) {
  //   console.log(`${initialPrice} -> ${number2Str(Math.sqrt(initialPrice) * (2 ** 96))}`);
  //   return number2Str(Math.sqrt(initialPrice) * (2 ** 96));
  // } else {
  //   console.log(`${initialPrice} -> ${number2Str(Math.sqrt(1 / initialPrice) * (2 ** 96))}`);
  //   return number2Str(Math.sqrt(1 / initialPrice) * (2 ** 96));
  // }
}

export function price2Tick(price: number, tickSpacing = 1) {
  return Math.floor(Math.log(price) / Math.log(1.0001) / tickSpacing) * tickSpacing;
}
