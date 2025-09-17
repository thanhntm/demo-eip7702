// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title MultiCall
/// @notice Execute multiple calls in a single transaction
/// @dev This doesn't solve the approval problem, but shows the multi-call pattern
contract MultiCall {
    struct Call {
        address target;
        bytes callData;
    }

    /// @notice Execute multiple calls in sequence
    /// @param calls Array of calls to execute
    function multiCall(Call[] calldata calls) external {
        for (uint i = 0; i < calls.length; i++) {
            (bool success, ) = calls[i].target.call(calls[i].callData);
            require(success, "Call failed");
        }
    }

    /// @notice Helper to encode approve call data
    /// @param spender The spender address
    /// @param amount The amount to approve
    function encodeApprove(address spender, uint256 amount) external pure returns (bytes memory) {
        return abi.encodeWithSelector(IERC20.approve.selector, spender, amount);
    }
}

/// @title ProxyApprover
/// @notice A different approach - act as a proxy for token operations
contract ProxyApprover {
    mapping(address => mapping(address => mapping(address => uint256))) public allowances;
    
    event ProxyApproval(address indexed owner, address indexed token, address indexed spender, uint256 amount);
    
    /// @notice Set approval through proxy
    function setApproval(address token, address spender, uint256 amount) external {
        allowances[msg.sender][token][spender] = amount;
        emit ProxyApproval(msg.sender, token, spender, amount);
    }
    
    /// @notice Batch set approvals
    function batchSetApproval(
        address[] calldata tokens,
        address spender,
        uint256[] calldata amounts
    ) external {
        require(tokens.length == amounts.length, "Length mismatch");
        
        for (uint i = 0; i < tokens.length; i++) {
            allowances[msg.sender][tokens[i]][spender] = amounts[i];
            emit ProxyApproval(msg.sender, tokens[i], spender, amounts[i]);
        }
    }
    
    /// @notice Execute transfer using proxy approval
    function proxyTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) external {
        require(allowances[from][token][msg.sender] >= amount, "Insufficient allowance");
        
        allowances[from][token][msg.sender] -= amount;
        require(IERC20(token).transferFrom(from, to, amount), "Transfer failed");
    }
}
