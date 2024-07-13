// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/// @notice Modern and gas efficient ERC20 + EIP-2612 implementation.
/// @author Solmate (https://github.com/transmissions11/solmate/blob/main/src/tokens/ERC20.sol)
/// @author Modified from Uniswap (https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2ERC20.sol)
/// @dev Do not manually set balances without updating totalSupply, as the sum of all user balances must not exceed it.
contract MockERC20 is ERC20 {
    constructor(string memory _name, string memory _symbol, uint _totalSupply) public
    ERC20(_name, _symbol) {
        _mint(msg.sender, _totalSupply);
    }
}
