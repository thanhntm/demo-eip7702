// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}

/// @title SafeBatchApproveV2
/// @notice Approve a spender for multiple ERC20 tokens in a single transaction.
///         Enhanced version with events and better error handling
contract SafeBatchApproveV2 {
    // Events for debugging
    event ApprovalStarted(address indexed token, address indexed owner, address indexed spender, uint256 amount);
    event ApprovalCompleted(address indexed token, address indexed owner, address indexed spender, uint256 amount);
    event ApprovalFailed(address indexed token, address indexed owner, address indexed spender, string reason);
    event CurrentAllowanceChecked(address indexed token, address indexed owner, address indexed spender, uint256 currentAllowance);

    /// @notice Approve spender for multiple tokens in one tx (simple version)
    /// @param tokens The list of ERC20 token addresses
    /// @param spender The address that will be approved
    /// @param amount The allowance amount
    function batchApproveSimple(
        address[] calldata tokens,
        address spender,
        uint256 amount
    ) external {
        require(spender != address(0), "INVALID_SPENDER");
        require(tokens.length > 0, "NO_TOKENS");

        for (uint i = 0; i < tokens.length; i++) {
            address tokenAddr = tokens[i];
            require(tokenAddr != address(0), "INVALID_TOKEN");
            
            emit ApprovalStarted(tokenAddr, msg.sender, spender, amount);
            
            IERC20 token = IERC20(tokenAddr);
            
            // Just do direct approval without resetting
            bool success = token.approve(spender, amount);
            
            if (success) {
                emit ApprovalCompleted(tokenAddr, msg.sender, spender, amount);
            } else {
                emit ApprovalFailed(tokenAddr, msg.sender, spender, "APPROVE_RETURNED_FALSE");
                revert("APPROVE_FAILED");
            }
        }
    }

    /// @notice Approve spender for multiple tokens in one tx (safe version with reset)
    /// @param tokens The list of ERC20 token addresses
    /// @param spender The address that will be approved
    /// @param amount The allowance amount
    function batchApproveSafe(
        address[] calldata tokens,
        address spender,
        uint256 amount
    ) external {
        require(spender != address(0), "INVALID_SPENDER");
        require(tokens.length > 0, "NO_TOKENS");

        for (uint i = 0; i < tokens.length; i++) {
            address tokenAddr = tokens[i];
            require(tokenAddr != address(0), "INVALID_TOKEN");
            
            emit ApprovalStarted(tokenAddr, msg.sender, spender, amount);
            
            IERC20 token = IERC20(tokenAddr);

            uint256 currentAllowance = token.allowance(msg.sender, spender);
            emit CurrentAllowanceChecked(tokenAddr, msg.sender, spender, currentAllowance);

            // If current allowance is not zero, reset to 0 first
            if (currentAllowance > 0) {
                bool resetSuccess = token.approve(spender, 0);
                if (!resetSuccess) {
                    emit ApprovalFailed(tokenAddr, msg.sender, spender, "RESET_FAILED");
                    revert("RESET_FAILED");
                }
            }

            // Now set to desired amount
            bool success = token.approve(spender, amount);
            
            if (success) {
                emit ApprovalCompleted(tokenAddr, msg.sender, spender, amount);
            } else {
                emit ApprovalFailed(tokenAddr, msg.sender, spender, "APPROVE_FAILED");
                revert("APPROVE_FAILED");
            }
        }
    }

    /// @notice Check if a token contract exists and is valid
    /// @param tokenAddr The token address to check
    function checkToken(address tokenAddr) external view returns (
        bool exists,
        string memory name,
        string memory symbol,
        uint256 userBalance
    ) {
        if (tokenAddr == address(0)) {
            return (false, "", "", 0);
        }

        try IERC20(tokenAddr).name() returns (string memory _name) {
            name = _name;
            exists = true;
        } catch {
            return (false, "", "", 0);
        }

        try IERC20(tokenAddr).symbol() returns (string memory _symbol) {
            symbol = _symbol;
        } catch {
            symbol = "UNKNOWN";
        }

        try IERC20(tokenAddr).balanceOf(msg.sender) returns (uint256 _balance) {
            userBalance = _balance;
        } catch {
            userBalance = 0;
        }
    }
}
