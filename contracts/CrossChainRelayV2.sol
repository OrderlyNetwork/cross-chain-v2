// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import { OAppUpgradeable, MessagingFee, Origin } from "./layerzero/oapp/OAppUpgradeable.sol";
import { OAppOptionsType3Upgradeable } from "./layerzero/oapp/libs/OAppOptionsType3Upgradeable.sol";
import { OptionsBuilder } from "./layerzero/oapp/libs/OptionsBuilder.sol";
import { IOrderlyCrossChain, LzOption, IOrderlyCrossChainReceiver } from "./interface/IOrderlyCrossChain.sol";
import { OrderlyCrossChainMessage } from "./utils/OrderlyCrossChainMessage.sol";

abstract contract OApp is OAppUpgradeable, OAppOptionsType3Upgradeable {
    mapping(uint32 => mapping(bytes32 => uint64)) public nonce;

    /// @notice Maps message flow types to their gas limits for cross-chain operations
    mapping(uint8 => LzOption) public lzOptions;

    uint128 constant DEFAULT_GAS_LIMIT = 3000000;
    // 50 slots
    uint256[48] private __gap;

    event MsgReceived(uint8 method);

    /// @notice Emitted when a ping message is received
    event Ping();

    /// @notice Emitted when a pong response is sent
    event Pong();

    using OptionsBuilder for bytes;

    constructor() {
        _disableInitializers();
    }

    function initialize(address _lzEndpoint, address _delegate) external virtual initializer {
        __initializeOApp(_lzEndpoint, _delegate);
    }

    function nextNonce(uint32 _srcEid, bytes32 _sender) public view override returns (uint64) {
        return nonce[_srcEid][_sender] + 1;
    }

    function getLzOption(uint8 _method) public view returns (bytes memory) {
        uint128 lzGas = lzOptions[_method].lzGas;
        uint128 lzValue = lzOptions[_method].lzValue;

        if (lzGas == 0) {
            lzGas = DEFAULT_GAS_LIMIT;
        }

        bytes memory lzOption = OptionsBuilder
            .newOptions()
            .addExecutorLzReceiveOption(lzGas, lzValue)
            .addExecutorOrderedExecutionOption();
        return lzOption;
    }
}

/// @notice Data storage layout for the CrossChainRelay contract
/// @dev Separate contract to enforce proper storage layout with upgradeable contracts
contract CrossChainRelayDataLayout {
    /// @notice Maps native chain IDs to their corresponding LayerZero chain IDs
    mapping(uint256 => uint32) public chainId2Eid;

    /// @notice Reverse mapping of LayerZero chain IDs to native chain IDs
    mapping(uint32 => uint256) public eid2ChainId;

    /// @notice Maps chain IDs to their respective cross-chain manager contract addresses
    /// @dev Deprecated - No longer needed as manager address is stored directly
    mapping(uint256 => address) public ccManagerMapping;

    /// @notice Maps chain IDs to their respective cross-chain relay contract addresses
    /// @dev Deprecated - No longer needed as relay addresses are handled by LayerZero
    mapping(uint256 => address) public ccChainRelayMapping;

    /// @notice The chain ID where this contract is deployed
    // uint256 public currentChainId;

    /// @notice Address of the cross-chain manager (Vault or Ledger) on this chain
    address public ccManagerAddress;

    uint256[43] private __gap;
}
contract CrossChainRelayV2 is IOrderlyCrossChain, OApp, CrossChainRelayDataLayout {
    using OrderlyCrossChainMessage for OrderlyCrossChainMessage.MessageV1;

    modifier validNonce(Origin calldata _origin) {
        require(_origin.nonce == nonce[_origin.srcEid][_origin.sender] + 1, "CrossChainRelayV2: invalid nonce");
        nonce[_origin.srcEid][_origin.sender]++;
        _;
    }

    modifier onlyCCManager() {
        require(msg.sender == ccManagerAddress, "CrossChainRelayV2: only CC manager can call this function");
        _;
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override validNonce(_origin) {
        // TODO: Implement the logic to receive messages from the LayerZero endpoint
        (OrderlyCrossChainMessage.MessageV1 memory message, bytes memory payload) = OrderlyCrossChainMessage
            .decodeMessageV1AndPayload(_payload);

        receiveMessage(message, payload);
    }

    function receiveMessage(OrderlyCrossChainMessage.MessageV1 memory message, bytes memory payload) internal {
        // TODO: Implement the logic to receive messages from the LayerZero endpoint
        emit MessageReceived(message, payload);
        if (message.method == uint8(OrderlyCrossChainMessage.CrossChainMethod.PingPong)) {
            // send pong back;
            ping(message.srcChainId);
            emit Pong();
        } else if (message.method == uint8(OrderlyCrossChainMessage.CrossChainMethod.Ping)) {
            emit Ping();
        } else {
            IOrderlyCrossChainReceiver(ccManagerAddress).receiveMessage(message, payload);
        }
    }

    // function receiveMessage(OrderlyCrossChainMessage.MessageV1 memory message, bytes memory payload) internal {}

    /// @notice Adds a new chain ID mapping to LayerZero chain IDs
    /// @param _chainId The chain ID
    /// @param _eid The LayerZero EID
    function addChainIdMapping(uint256 _chainId, uint32 _eid) external onlyOwner {
        chainId2Eid[_chainId] = _eid;
        eid2ChainId[_eid] = _chainId;
    }

    /// @notice Sets the cross-chain manager address
    /// @dev Deprecated - No longer needed as manager address is stored directly
    /// @param _chainId The chain ID
    /// @param _ccManager The cross-chain manager address
    function addCrossChainManagerMapping(uint256 _chainId, address _ccManager) external onlyOwner {
        ccManagerMapping[_chainId] = _ccManager;
    }

    /// @notice Sets the cross-chain relay address
    /// @dev Deprecated - No longer needed as relay addresses are handled by LayerZero
    /// @param _chainId The chain ID
    /// @param _crossChainRelay The cross-chain relay address
    function addCrossChainRelayMapping(uint256 _chainId, address _crossChainRelay) external onlyOwner {
        ccChainRelayMapping[_chainId] = _crossChainRelay;
    }

    /// @notice Sets the manager address
    /// @param _address The manager address
    function setccManagerAddress(address _address) external onlyOwner {
        ccManagerAddress = _address;
    }

    /// @notice Sets the flow gas limit mapping
    /// @param _flow The flow ID
    /// @param _lzGas The gas limit
    /// @param _lzValue The value
    function addFlowGasLimitMapping(uint8 _flow, uint128 _lzGas, uint128 _lzValue) external onlyOwner {
        lzOptions[_flow] = LzOption({ lzGas: _lzGas, lzValue: _lzValue });
    }

    /// @notice Estimates the gas fee for a center message
    /// @param data The cross-chain meta message
    /// @param payload The payload
    /// @return The gas fee
    function estimateGasFee(
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) public view override returns (uint256) {
        // TODO: Implement the logic to estimate the gas fee
        bytes memory lzPayload = data.encodeMessageV1AndPayload(payload);
        uint32 dstEid = chainId2Eid[data.dstChainId];
        bytes memory lzOption = getLzOption(data.method);
        MessagingFee memory msgFee = _quote(dstEid, lzPayload, lzOption, false);
        return msgFee.nativeFee;
    }

    /// @notice Sends a cross-chain message
    /// @param data The cross-chain meta message
    /// @param payload The payload
    function sendMessage(
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) public payable override onlyCCManager {
        bytes memory lzPayload = data.encodeMessageV1AndPayload(payload);

        uint32 dstEid = chainId2Eid[data.dstChainId];

        require(dstEid != 0, "CrossChainRelay: invalid dst chain id");

        uint256 nativeFee = estimateGasFee(data, payload);

        bytes memory lzOption = getLzOption(data.method);

        _lzSend(dstEid, lzPayload, lzOption, MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 }), address(this));

        emit MessageSent(data, payload);
    }

    /// @notice Sends a cross-chain message with fee
    /// @param data The cross-chain meta message
    /// @param payload The payload
    function sendMessageWithFee(
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) public payable override onlyCCManager {
        uint256 nativeFee = estimateGasFee(data, payload);
        require(msg.value >= nativeFee, "CrossChainRelay: insufficient fee");
        sendMessage(data, payload);
    }

    /// @notice Sends a cross-chain message with fee
    /// @param refundReceiver The receiver address for the lz fee refund
    /// @param data The cross-chain meta message
    /// @param payload The payload
    function sendMessageWithFeeRefund(
        address refundReceiver,
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) public payable override onlyCCManager {
        bytes memory lzPayload = data.encodeMessageV1AndPayload(payload);
        uint32 dstEid = chainId2Eid[data.dstChainId];
        require(dstEid != 0, "CrossChainRelay: invalid dst chain id");

        uint256 nativeFee = estimateGasFee(data, payload);

        bytes memory lzOption = getLzOption(data.method);

        require(msg.value >= nativeFee, "CrossChainRelay: insufficient fee");

        _lzSend(
            dstEid,
            lzPayload,
            lzOption,
            MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 }),
            payable(refundReceiver)
        );
        emit MessageSent(data, payload);
    }

    /// @notice Tests a function, sends ping to another chain
    /// @param dstChainId The destination chain ID
    function ping(uint256 dstChainId) internal {
        OrderlyCrossChainMessage.MessageV1 memory data = OrderlyCrossChainMessage.MessageV1({
            method: uint8(OrderlyCrossChainMessage.CrossChainMethod.Ping),
            option: 0,
            payloadDataType: 0,
            srcCrossChainManager: address(0),
            dstCrossChainManager: address(0),
            srcChainId: block.chainid,
            dstChainId: dstChainId
        });
        sendMessage(data, bytes(""));
    }

    /// @notice Tests a function, sends ping to another chain and expects pong back
    /// @param dstChainId The destination chain ID
    function pingPong(uint256 dstChainId) external onlyOwner {
        OrderlyCrossChainMessage.MessageV1 memory data = OrderlyCrossChainMessage.MessageV1({
            method: uint8(OrderlyCrossChainMessage.CrossChainMethod.PingPong),
            option: 0,
            payloadDataType: 0,
            srcCrossChainManager: address(0),
            dstCrossChainManager: address(0),
            srcChainId: block.chainid,
            dstChainId: dstChainId
        });
        sendMessage(data, bytes(""));
    }
}
