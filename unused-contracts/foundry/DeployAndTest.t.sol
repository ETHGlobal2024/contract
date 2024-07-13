// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../contracts/lib/forge-std/src/Test.sol";
import "../../contracts/lib/forge-std/src/StdUtils.sol";
import {MockERC20} from "../../contracts/MockERC20.sol";
import {PoolManager} from "../../contracts/uniswap-v4-core/PoolManager.sol";
import {PoolModifyLiquidity} from "../../contracts/PoolModifyLiquidity.sol";
import {PoolSwap} from "../../contracts/PoolSwap.sol";
import {PoolId, PoolIdLibrary} from "../../contracts/uniswap-v4-core/types/PoolId.sol";
import {PoolKey} from "../../contracts/uniswap-v4-core/types/PoolKey.sol";
import {IPoolManager} from "../../contracts/uniswap-v4-core/interfaces/IPoolManager.sol";
import {CurrencyLibrary, Currency} from "../../contracts/uniswap-v4-core/types/Currency.sol";

import {IHooks} from "../../contracts/uniswap-v4-core/interfaces/IHooks.sol";

contract LiquidityTest is Test {
  using PoolIdLibrary for PoolKey;

  MockERC20 public tokenA;
  MockERC20 public tokenB;
  PoolManager public poolManager;
  PoolModifyLiquidity public poolModifyLiquidity;
  PoolSwap public poolSwap;

  uint256 public initialBalance = 10000 ether;

  address admin = address(0x1234);

  function setUp() public {
    vm.startPrank(admin);

    tokenA = new MockERC20("Mock Token A", "MTA", 1000000000000000000 ether);
    tokenB = new MockERC20("Mock Token B", "MTB", 1000000000000000000 ether);

    poolManager = new PoolManager(999999999);
    poolModifyLiquidity = new PoolModifyLiquidity((poolManager));
    poolSwap = new PoolSwap((poolManager));

    tokenA.approve(address(poolModifyLiquidity), initialBalance);
    tokenB.approve(address(poolModifyLiquidity), initialBalance);
  }

  function calcSqrtPriceX96(address tokenAAddress, address tokenBAddress, uint256 initialPrice)
  internal
  pure
  returns (uint160) {
    uint256 sqrtPriceX96;
    if (tokenAAddress < tokenBAddress) {
      sqrtPriceX96 = uint256(sqrt(initialPrice * 100000000) * 2**96) / 100000000;
    } else {
      sqrtPriceX96 = uint256(sqrt(1 * 100000000 / initialPrice) * 2**96) / 100000000;
    }
    return uint160(sqrtPriceX96);
  }

  function sqrt(uint256 x) internal pure returns (uint256 y) {
    uint256 z = (x + 1) / 2;
    y = x;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2;
    }
  }

  function testInitializeAndAddLiquidity() public {
    vm.startPrank(admin);

    int24 tickLower = 84120;
    int24 tickUpper = 86100;
    int256 delta = 10000 ether;

    // 初始化池子

    Currency currency0;
    Currency currency1;

    if (address(tokenA) < address(tokenB)) {
      currency0 = Currency.wrap(address(tokenA));
      currency1 = Currency.wrap(address(tokenB));
    } else {
      currency0 = Currency.wrap(address(tokenB));
      currency1 = Currency.wrap(address(tokenA));
    }

    PoolKey memory poolKey = PoolKey({
      currency0: currency0,
      currency1: currency1,
      fee: 3000,
      tickSpacing: 60,
      hooks: IHooks(address(0))
    });

    uint160 sqrtPriceX96 = calcSqrtPriceX96(address(tokenA), address(tokenB), 5000);

    poolManager.initialize(poolKey, sqrtPriceX96, ""); // 假设初始化价格为5000

    IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
      tickLower: tickLower,
      tickUpper: tickUpper,
      liquidityDelta: delta,
      salt: bytes32(0)
    });

    poolModifyLiquidity.modifyLiquidity(poolKey, params, "");
  }

}
