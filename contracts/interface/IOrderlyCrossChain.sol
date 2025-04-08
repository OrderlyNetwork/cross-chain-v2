// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../utils/OrderlyCrossChainMessage.sol";

struct LzOption {
    uint128 lzGas;
    uint128 lzValue;
}

// Interface for the Cross Chain Operations
interface IOrderlyCrossChain {
    // Event to be emitted when a message is sent
    event MessageSent(OrderlyCrossChainMessage.MessageV1 message, bytes payload);

    // Event to be emitted when a message is received
    event MessageReceived(OrderlyCrossChainMessage.MessageV1 message, bytes payload);

    /// @notice estimate gas fee
    /// @param data message data
    /// @param payload payload
    function estimateGasFee(
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) external view returns (uint256);

    /// @notice send message
    /// @param message message
    /// @param payload payload
    function sendMessage(OrderlyCrossChainMessage.MessageV1 memory message, bytes memory payload) external payable;

    /// @notice send message with fee, so no estimate gas fee will not run
    /// @param message message
    /// @param payload payload
    function sendMessageWithFee(
        OrderlyCrossChainMessage.MessageV1 memory message,
        bytes memory payload
    ) external payable;

    /// @notice send message with fee, so no estimate gas fee will not run
    /// @param refundReceiver receiver of the refund
    /// @param message message
    /// @param payload payload
    function sendMessageWithFeeRefund(
        address refundReceiver,
        OrderlyCrossChainMessage.MessageV1 memory message,
        bytes memory payload
    ) external payable;
}

// Interface for the Cross Chain Receiver
interface IOrderlyCrossChainReceiver {
    /// @notice receive message from relay, relay will call this function to send messages
    /// @param message message
    /// @param payload payload
    function receiveMessage(OrderlyCrossChainMessage.MessageV1 memory message, bytes memory payload) external;
}
