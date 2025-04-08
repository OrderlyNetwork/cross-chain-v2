// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import { OAppUpgradeable, MessagingFee, Origin } from "./layerzero/oapp/OAppUpgradeable.sol";
import { OAppOptionsType3Upgradeable } from "./layerzero/oapp/libs/OAppOptionsType3Upgradeable.sol";
contract CrossChainRelayV2 is OAppUpgradeable, OAppOptionsType3Upgradeable {
    /**
     * @dev Disable the initializer on the implementation contract
     */
    constructor() {
        _disableInitializers();
    }

    function initialize(address _lzEndpoint, address _delegate) external virtual initializer {
        __initializeOApp(_lzEndpoint, _delegate);
    }

    function _lzReceive(
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        // TODO: Implement the logic to receive messages from the LayerZero endpoint
    }
}
