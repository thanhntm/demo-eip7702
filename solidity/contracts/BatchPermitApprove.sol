// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

/// @title BatchPermitApprove
/// @notice Use EIP-2612 permit to approve multiple tokens in one transaction
contract BatchPermitApprove {
    struct PermitData {
        address token;
        uint256 amount;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /// @notice Batch approve using permits (off-chain signatures)
    /// @param permits Array of permit data for each token
    /// @param spender The address to approve
    function batchPermitApprove(
        PermitData[] calldata permits,
        address spender
    ) external {
        for (uint i = 0; i < permits.length; i++) {
            PermitData memory permitData = permits[i];
            
            IERC20Permit(permitData.token).permit(
                msg.sender,           // owner
                spender,             // spender  
                permitData.amount,   // amount
                permitData.deadline, // deadline
                permitData.v,        // v
                permitData.r,        // r
                permitData.s         // s
            );
        }
    }
}
