// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { CrossChainRelayV2, IOrderlyCrossChainReceiver } from "../../contracts/CrossChainRelayV2.sol";
import { OrderlyCrossChainMessage } from "../../contracts/utils/OrderlyCrossChainMessage.sol";

import { IOAppOptionsType3, EnforcedOptionParam } from "../../contracts/layerzero/oapp/libs/OAppOptionsType3Upgradeable.sol";
import { OptionsBuilder } from "../../contracts/layerzero/oapp/libs/OptionsBuilder.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "forge-std/console.sol";
import { TestHelperOz5 } from "@layerzerolabs/test-devtools-evm-foundry/contracts/TestHelperOz5.sol";

enum CrossChainMethod {
    Deposit, // from vault to ledger
    Withdraw, // from ledger to vault
    WithdrawFinish, // from vault to ledger
    Ping, // for message testing
    PingPong, // ABA message testing
    RebalanceBurn, // burn request from ledger to vault
    RebalanceBurnFinish, // burn request finish from vault to ledger
    RebalanceMint, // mint request from ledger to vault
    RebalanceMintFinish, //  mint request finish from vault to ledger
    Withdraw2Contract, // withdraw to contract address
    COUNT
}

contract CrossChainRelayV2Test is TestHelperOz5 {
    using OptionsBuilder for bytes;

    uint32 private orderlyEid = 1;
    uint32 private arbEid = 2;
    uint32 private opEid = 3;

    uint256 private orderlyChainId = 101;
    uint256 private arbChainId = 102;
    uint256 private opChainId = 103;

    CrossChainRelayV2 private orderlyRelay;
    CrossChainRelayV2 private arbRelay;
    CrossChainRelayV2 private opRelay;

    IOrderlyCrossChainReceiver private orderlyManager = IOrderlyCrossChainReceiver(address(0x123));
    IOrderlyCrossChainReceiver private arbManager = IOrderlyCrossChainReceiver(address(0x456));
    IOrderlyCrossChainReceiver private opManager = IOrderlyCrossChainReceiver(address(0x789));

    address private delegate = address(0x100);

    function setUp() public override {
        super.setUp();
        setUpEndpoints(3, LibraryType.UltraLightNode);

        address relayImplAddress = address(new CrossChainRelayV2());

        orderlyRelay = CrossChainRelayV2(
            payable(
                new ERC1967Proxy(
                    relayImplAddress,
                    abi.encodeWithSignature("initialize(address,address)", endpoints[orderlyEid], delegate)
                )
            )
        );
        arbRelay = CrossChainRelayV2(
            payable(
                new ERC1967Proxy(
                    relayImplAddress,
                    abi.encodeWithSignature("initialize(address,address)", endpoints[arbEid], delegate)
                )
            )
        );
        opRelay = CrossChainRelayV2(
            payable(
                new ERC1967Proxy(
                    relayImplAddress,
                    abi.encodeWithSignature("initialize(address,address)", endpoints[opEid], delegate)
                )
            )
        );

        vm.deal(address(orderlyRelay), 100 ether);
        vm.deal(address(arbRelay), 100 ether);
        vm.deal(address(opRelay), 100 ether);

        vm.startPrank(delegate);
        // set chainId and eid
        orderlyRelay.addChainIdMapping(arbChainId, arbEid);
        orderlyRelay.addChainIdMapping(opChainId, opEid);
        arbRelay.addChainIdMapping(orderlyChainId, orderlyEid);
        opRelay.addChainIdMapping(orderlyChainId, orderlyEid);

        // set cc manager
        orderlyRelay.setCCManagerAddress(address(orderlyManager));
        arbRelay.setCCManagerAddress(address(arbManager));
        opRelay.setCCManagerAddress(address(opManager));

        // set lz option
        for (uint8 i = 0; i < uint8(CrossChainMethod.COUNT); i++) {
            orderlyRelay.addFlowLzOption(i, 1000000, 0);
        }

        // set peer
        orderlyRelay.setPeer(arbEid, addressToBytes32(address(arbRelay)));
        orderlyRelay.setPeer(opEid, addressToBytes32(address(opRelay)));
        arbRelay.setPeer(orderlyEid, addressToBytes32(address(orderlyRelay)));
        opRelay.setPeer(orderlyEid, addressToBytes32(address(orderlyRelay)));
        vm.stopPrank();
    }

    function test_initialize() public view {
        assertEq(orderlyRelay.owner(), delegate);
        assertEq(arbRelay.owner(), delegate);
        assertEq(opRelay.owner(), delegate);

        assertEq(address(orderlyRelay.endpoint()), address(endpoints[orderlyEid]));
        assertEq(address(arbRelay.endpoint()), address(endpoints[arbEid]));
        assertEq(address(opRelay.endpoint()), address(endpoints[opEid]));

        assertEq(orderlyRelay.ccManagerAddress(), address(orderlyManager));
        assertEq(arbRelay.ccManagerAddress(), address(arbManager));
        assertEq(opRelay.ccManagerAddress(), address(opManager));
    }

    function test_pingpong() public {
        vm.startPrank(delegate);
        orderlyRelay.pingPong(arbChainId);
        vm.stopPrank();
    }
}
