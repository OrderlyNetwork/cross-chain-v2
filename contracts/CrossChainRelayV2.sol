// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import { OAppUpgradeable, MessagingFee, Origin, MessagingReceipt } from "./layerzero/oapp/OAppUpgradeable.sol";
import { OAppOptionsType3Upgradeable } from "./layerzero/oapp/libs/OAppOptionsType3Upgradeable.sol";
import { OptionsBuilder } from "./layerzero/oapp/libs/OptionsBuilder.sol";
import { IOrderlyCrossChain, LzOption, IOrderlyCrossChainReceiver } from "./interface/IOrderlyCrossChain.sol";
import { OrderlyCrossChainMessage } from "./utils/OrderlyCrossChainMessage.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
/// @notice OApp contract component for CrossChainRelayV2
/// @dev Seperate the OApp part from the CrossChainRelayV2
abstract contract OApp is OAppUpgradeable, OAppOptionsType3Upgradeable {
    /// @notice Nonce mapping for each source endpoint and sender address
    /// @dev This is used to prevent replay attacks
    /// @dev srcEid => sender => nonce
    mapping(uint32 => mapping(bytes32 => uint64)) public nonce;

    /// @notice Maps message flow types to their gas limits for cross-chain operations
    /// @dev This is used to save the gas limit and value for each message method
    /// @dev The method is defined in OrderlyCrossChainMessage.CrossChainMethod
    mapping(uint8 => LzOption) public lzOptions;

    /// @notice Gap to prevent storage collisions
    /// @dev This is used to prevent storage collisions
    /// @dev The gap is used to add new storage variables without breaking the storage layout
    /// @dev The above used slots + the rest of the slots are 50 (2 + 48)
    uint256[48] private __gap;

    /// @notice Emitted when a ping message is received
    event Ping();

    /// @notice Emitted when a pong response is sent
    event Pong();

    /// @notice Emitted when a chain ID mapping is added
    /// @param _chainId The chain ID
    /// @param _eid The LayerZero EID
    event ChainIdAdded(uint256 _chainId, uint32 _eid);

    /// @notice Emitted when the CC manager is set
    /// @param _oldCCManager The old CC manager address
    /// @param _newCCManager The new CC manager address
    event CCManagerSet(address _oldCCManager, address _newCCManager);

    /// @notice Emitted when the method option is set
    /// @param _method The method
    /// @param _lzGas The gas limit for the transaction execution on the dst chain
    /// @param _lzValue The value to airdrop on the dst chain
    event MethodOptionSet(uint8 _method, uint128 _lzGas, uint128 _lzValue);

    /// @notice Default gas limit for cross-chain operations
    /// @dev This is used to set the default gas limit for cross-chain operations
    /// @dev The default gas limit is 3000000
    uint128 constant DEFAULT_GAS_LIMIT = 3000000;

    /// @notice Options builder for the OApp
    /// @dev This is used to build the options for the OApp
    using OptionsBuilder for bytes;

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the OApp
    /// @param _lzEndpoint The LayerZero endpoint
    /// @param _delegate The delegate, the owner of the contract and the delegate to the LayerZero endpoint
    function initialize(address _lzEndpoint, address _delegate) external virtual initializer {
        __initializeOApp(_lzEndpoint, _delegate);
    }

    /// @notice Gets the next nonce for the given source endpoint and sender address
    /// @param _srcEid The source endpoint ID
    /// @param _sender The sender address
    /// @return The next nonce
    function nextNonce(uint32 _srcEid, bytes32 _sender) public view override returns (uint64) {
        return nonce[_srcEid][_sender] + 1;
    }

    /// @notice Gets the LayerZero option for the given method
    /// @param _method The method
    /// @return The LayerZero option, if the lzGas is 0, it will use the default gas limit
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

    /// @notice Receive function to receive native tokens
    /// @dev This is used to receive native tokens to pay for LayerZero fees
    receive() external payable {}
}

/// @notice Data storage layout for the CrossChainRelayV2 contract
/// @dev Separate contract to enforce proper storage layout with upgradeable contracts
contract CrossChainRelayDataLayoutV2 {
    /// @notice Maps native chain IDs to their corresponding Endpoint IDs
    mapping(uint256 => uint32) public chainId2Eid;

    /// @notice Reverse mapping of Endpoint IDs to native chain IDs
    mapping(uint32 => uint256) public eid2ChainId;

    /// @notice Address of the cross-chain manager (Vault or Ledger) on this chain
    address public ccManager;

    /// @notice Gap to prevent storage collisions
    /// @dev This is used to prevent storage collisions
    /// @dev The gap is used to add new storage variables without breaking the storage layout
    /// @dev The above used slots + the rest of the slots are 50 (3 + 47)
    uint256[47] private __gap;
}

/// @notice CrossChainRelayV2 contract
/// @dev This is the main contract for the CrossChainRelayV2
/// @dev It implements the IOrderlyCrossChain interface
/// @dev It inherits from the OAppUpgradeable and CrossChainRelayDataLayoutV2
contract CrossChainRelayV2 is IOrderlyCrossChain, OApp, CrossChainRelayDataLayoutV2 {
    /// @notice OrderlyCrossChainMessage library for the CrossChainRelayV2
    using OrderlyCrossChainMessage for OrderlyCrossChainMessage.MessageV1;
    using SafeERC20 for IERC20;

    /// @notice Modifier to check if the nonce is valid
    /// @param _origin The origin of the message
    /// @dev This is used to prevent replay attacks
    /// @dev The received nonce is checked against the saved nonce in the CrossChainRelayDataLayoutV2
    /// @dev The saved nonce is incremented by 1 after the message is received
    modifier validNonce(Origin calldata _origin) {
        require(_origin.nonce == nonce[_origin.srcEid][_origin.sender] + 1, "CrossChainRelayV2: invalid nonce");
        nonce[_origin.srcEid][_origin.sender]++;
        _;
    }

    /// @notice Modifier to check if the sender is the CC manager
    /// @dev This is used to prevent unauthorized access to the CrossChainRelayV2
    /// @dev The sender must be the ccManager
    /// @dev The ccManager is the address of the cross-chain manager (Vault or Ledger) on this chain
    modifier onlyCCManager() {
        require(msg.sender == ccManager, "CrossChainRelayV2: only CC manager can call this function");
        _;
    }

    function initialize(address _lzEndpoint, address _delegate) external override initializer {
        __initializeOApp(_lzEndpoint, _delegate);
    }

    /// @notice Internal function to receive messages from LayerZero
    /// @param _origin The origin of the message
    /// @dev The origin contains the following:
    /// @dev - srcEid: The source chain endpoint ID.
    /// @dev - sender: The sender address from the src chain.
    /// @dev - nonce: The nonce of the LayerZero message.
    /// @param _payload The payload of the message
    /// @param _guid The guid of the message
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override whenNotPaused validNonce(_origin) {
        (OrderlyCrossChainMessage.MessageV1 memory message, bytes memory payload) = OrderlyCrossChainMessage
            .decodeMessageV1AndPayload(_payload);

        _receiveMessage(message, payload);
        emit MessageReceived(_origin, _guid);
    }

    /// @notice Internal function to receive messages from LayerZero
    /// @param _message The message part of the cc message
    /// @param _payload The payload part of the cc message
    function _receiveMessage(OrderlyCrossChainMessage.MessageV1 memory _message, bytes memory _payload) internal {
        if (_message.method == uint8(OrderlyCrossChainMessage.CrossChainMethod.PingPong)) {
            // send pong back;
            ping(_message.srcChainId);
            emit Pong();
        } else if (_message.method == uint8(OrderlyCrossChainMessage.CrossChainMethod.Ping)) {
            emit Ping();
        } else {
            // Relay the message to the ccManager to handle
            IOrderlyCrossChainReceiver(ccManager).receiveMessage(_message, _payload);
        }
    }

    // function receiveMessage(OrderlyCrossChainMessage.MessageV1 memory message, bytes memory payload) internal {}

    /// @notice Adds a new chain ID mapping to LayerZero chain IDs
    /// @param _chainId The chain ID
    /// @param _eid The LayerZero EID
    function addChainIdMapping(uint256 _chainId, uint32 _eid) external onlyOwner {
        chainId2Eid[_chainId] = _eid;
        eid2ChainId[_eid] = _chainId;
        emit ChainIdAdded(_chainId, _eid);
    }

    /// @notice Sets the manager address
    /// @param _ccManager The manager address
    function setCCManager(address _ccManager) external onlyOwner {
        address oldCCManager = ccManager;
        require(oldCCManager != _ccManager, "CrossChainRelayV2: new CC manager is the same as the old one");
        ccManager = _ccManager;
        emit CCManagerSet(oldCCManager, _ccManager);
    }

    /// @notice Sets the method gas limit mapping
    /// @param _method The method to set the gas limit for
    /// @param _lzGas The gas limit for the transaction execution on the dst chain
    /// @param _lzValue The value to airdrop on the dst chain
    function setMethodOption(uint8 _method, uint128 _lzGas, uint128 _lzValue) external onlyOwner {
        lzOptions[_method] = LzOption({ lzGas: _lzGas, lzValue: _lzValue });
        emit MethodOptionSet(_method, _lzGas, _lzValue);
    }

    /// @notice Estimates the gas fee for a cc message
    /// @param data The cross-chain meta data
    /// @param payload The payload of the cc message
    /// @return The gas fee for the cc message, in native gas token
    function estimateGasFee(
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) public view override returns (uint256) {
        bytes memory lzPayload = data.encodeMessageV1AndPayload(payload);
        uint32 dstEid = chainId2Eid[data.dstChainId];
        bytes memory lzOption = getLzOption(data.method);
        MessagingFee memory msgFee = _quote(dstEid, lzPayload, lzOption, false);
        return msgFee.nativeFee;
    }

    /// @notice Sends a cross-chain message
    /// @param data The cross-chain meta data
    /// @param payload The payload of the cc message
    function sendMessage(
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) public payable override onlyCCManager {
        uint256 nativeFee = estimateGasFee(data, payload);
        MessagingReceipt memory receipt = _sendMessage(nativeFee, address(this), data, payload);
        emit MessageSent(receipt);
    }

    /// @notice Sends a cross-chain message with fee
    /// @param data The cross-chain meta data
    /// @param payload The payload of the cc message
    function sendMessageWithFee(
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) public payable override onlyCCManager {
        uint256 nativeFee = estimateGasFee(data, payload);
        require(msg.value >= nativeFee, "CrossChainRelay: insufficient fee");
        MessagingReceipt memory receipt = _sendMessage(nativeFee, address(this), data, payload);
        emit MessageSent(receipt);
    }

    /// @notice Sends a cross-chain message with fee
    /// @param refundReceiver The receiver address for the lz fee refund
    /// @param data The cross-chain meta data
    /// @param payload The payload of the cc message
    function sendMessageWithFeeRefund(
        address refundReceiver,
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) public payable override onlyCCManager {
        uint32 dstEid = chainId2Eid[data.dstChainId];
        require(dstEid != 0, "CrossChainRelay: invalid dst chain id");

        uint256 nativeFee = estimateGasFee(data, payload);
        require(msg.value >= nativeFee, "CrossChainRelay: insufficient fee");

        MessagingReceipt memory receipt = _sendMessage(nativeFee, payable(refundReceiver), data, payload);

        emit MessageSent(receipt);
    }

    /// @notice Sends a cross-chain message
    /// @param data The cross-chain meta data
    /// @param payload The payload of the cc message
    function _sendMessage(
        uint256 nativeFee,
        address refundReceiver,
        OrderlyCrossChainMessage.MessageV1 memory data,
        bytes memory payload
    ) internal whenNotPaused returns (MessagingReceipt memory receipt) {
        uint32 dstEid = chainId2Eid[data.dstChainId];
        require(dstEid != 0, "CrossChainRelay: invalid dst chain id");

        bytes memory lzPayload = data.encodeMessageV1AndPayload(payload);
        bytes memory lzOption = getLzOption(data.method);

        receipt = _lzSend(
            dstEid,
            lzPayload,
            lzOption,
            MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 }),
            refundReceiver
        );
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
        uint256 nativeFee = estimateGasFee(data, bytes(""));
        MessagingReceipt memory receipt = _sendMessage(nativeFee, address(this), data, bytes(""));
        emit MessageSent(receipt);
    }

    // ================================ ONLY OWNER FUNCTIONS ================================
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
        uint256 nativeFee = estimateGasFee(data, bytes(""));
        MessagingReceipt memory receipt = _sendMessage(nativeFee, address(this), data, bytes(""));
        emit MessageSent(receipt);
    }

    /// @notice Withdraws native tokens from the contract
    /// @param to Recipient address
    /// @param amount Amount of native tokens to withdraw
    function withdrawNativeToken(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = to.call{ value: amount }("");
        require(success, "Transfer failed");
    }

    /// @notice Withdraws ERC20 tokens from the contract
    /// @param token Token address
    /// @param to Recipient address
    /// @param amount Amount of tokens to withdraw
    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
}
