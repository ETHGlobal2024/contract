// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {PoolId} from "./uniswap-v4-core/types/PoolId.sol";
import {IPoolManager} from "./uniswap-v4-core/interfaces/IPoolManager.sol";
import {Position} from "./uniswap-v4-core/libraries/Position.sol";
import {StateLibrary} from "./uniswap-v4-core/libraries/StateLibrary.sol";

contract PoolReader {
    using StateLibrary for IPoolManager;

    IPoolManager public manager;

    constructor(IPoolManager _manager) {
        manager = _manager;
    }

    function getSlot0(PoolId poolId)
    external
    view
    returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)
    {
        return manager.getSlot0(poolId);
    }

    function getTickInfo(PoolId poolId, int24 tick)
    external
    view
    returns (
        uint128 liquidityGross,
        int128 liquidityNet,
        uint256 feeGrowthOutside0X128,
        uint256 feeGrowthOutside1X128
    )
    {
        return manager.getTickInfo(poolId, tick);
    }

    function getTickLiquidity(PoolId poolId, int24 tick)
    external
    view
    returns (uint128 liquidityGross, int128 liquidityNet)
    {
        return manager.getTickLiquidity(poolId, tick);
    }

    function getTickFeeGrowthOutside(PoolId poolId, int24 tick)
    external
    view
    returns (uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128)
    {
        return manager.getTickFeeGrowthOutside(poolId, tick);
    }

    function getFeeGrowthGlobals(PoolId poolId)
    external
    view
    returns (uint256 feeGrowthGlobal0, uint256 feeGrowthGlobal1)
    {
        return manager.getFeeGrowthGlobals(poolId);
    }

    function getLiquidity(PoolId poolId) external view returns (uint128 liquidity) {
        return manager.getLiquidity(poolId);
    }

    function getTickBitmap(PoolId poolId, int16 tick) external view returns (uint256 tickBitmap) {
        return manager.getTickBitmap(poolId, tick);
    }

    function getPositionInfo(PoolId poolId, bytes32 positionId)
    external
    view
    returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128)
    {
        return manager.getPositionInfo(poolId, positionId);
    }

    function getPosition(
        PoolId poolId,
        address owner,
        int24 tickLower,
        int24 tickUpper,
        bytes32 salt
    ) external view returns (Position.Info memory) {
        return manager.getPosition(poolId, owner, tickLower, tickUpper, salt);
    }

    function getPositionLiquidity(PoolId poolId, bytes32 positionId) external view returns (uint128 liquidity) {
        return manager.getPositionLiquidity(poolId, positionId);
    }

    function getFeeGrowthInside(PoolId poolId, int24 tickLower, int24 tickUpper)
    external
    view
    returns (uint256 feeGrowthInside0X128, uint256 feeGrowthInside1X128)
    {
        return manager.getFeeGrowthInside(poolId, tickLower, tickUpper);
    }
}
