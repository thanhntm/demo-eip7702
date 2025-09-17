// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @title SafeBatchApprove
/// @notice Approve a spender for multiple ERC20 tokens in a single transaction.
///         Uses "safe approve" pattern (reset allowance to 0 before setting new value)
///         to be compatible with non-standard tokens like USDT.
contract SafeBatchApprove {
    /// @notice Approve spender for multiple tokens in one tx
    /// @param tokens The list of ERC20 token addresses
    /// @param spender The address that will be approved
    /// @param amount The allowance amount (use type(uint256).max for infinite)
    function batchApprove(
        address[] calldata tokens,
        address spender,
        uint256 amount
    ) external {
        require(spender != address(0), "INVALID_SPENDER");

        for (uint i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);

            uint256 currentAllowance = token.allowance(msg.sender, spender);

            // If current allowance is not zero, reset to 0 first
            if (currentAllowance > 0) {
                require(token.approve(spender, 0), "RESET_FAILED");
            }

            // Now set to desired amount
            require(token.approve(spender, amount), "APPROVE_FAILED");
        }
    }
}