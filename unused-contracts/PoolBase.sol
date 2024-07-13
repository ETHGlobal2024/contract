// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Currency} from "./uniswap-v4-core/types/Currency.sol";
import {IERC20Minimal} from "./uniswap-v4-core/interfaces/external/IERC20Minimal.sol";

import {IUnlockCallback} from "./uniswap-v4-core/interfaces/callback/IUnlockCallback.sol";
import {IPoolManager} from "./uniswap-v4-core/interfaces/IPoolManager.sol";

import {StateLibrary} from "./uniswap-v4-core/libraries/StateLibrary.sol";
import {TransientStateLibrary} from "./uniswap-v4-core/libraries/TransientStateLibrary.sol";

abstract contract PoolBase {
    using StateLibrary for IPoolManager;
    using TransientStateLibrary for IPoolManager;

    IPoolManager public immutable manager;

    constructor(IPoolManager _manager) {
        manager = _manager;
    }

    function _fetchBalances(Currency currency, address user, address deltaHolder)
        internal
        view
        returns (uint256 userBalance, uint256 poolBalance, int256 delta)
    {
        userBalance = currency.balanceOf(user);
        poolBalance = currency.balanceOf(address(manager));
        delta = manager.currencyDelta(deltaHolder, currency);
    }
}
