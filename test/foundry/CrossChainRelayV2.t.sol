// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { CrossChainRelayV2, IOrderlyCrossChainReceiver } from "../../contracts/CrossChainRelayV2.sol";
import { ContractFactory } from "../../contracts/ContractFactory.sol";
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

    uint256 private relayBalance = 100 ether;
    uint128 private lzGas = 1000000;

    IOrderlyCrossChainReceiver private orderlyManager = IOrderlyCrossChainReceiver(address(0x123));
    IOrderlyCrossChainReceiver private arbManager = IOrderlyCrossChainReceiver(address(0x456));
    IOrderlyCrossChainReceiver private opManager = IOrderlyCrossChainReceiver(address(0x789));

    address private delegate = address(0x100);
    address private owner = delegate;

    ContractFactory factory;
    bytes32 saltOrderlyRelay = keccak256(abi.encodePacked("test_salt_orderly_relay"));
    bytes32 saltArbRelay = keccak256(abi.encodePacked("test_salt_arb_relay"));
    bytes32 saltOpRelay = keccak256(abi.encodePacked("test_salt_op_relay"));

    function setUp() public override {
        super.setUp();
        setUpEndpoints(3, LibraryType.UltraLightNode);

        _set_factory();

        _set_relays();
    }

    function test_deploy() public view {
        assertEq(factory.getDeployed(saltOrderlyRelay), address(orderlyRelay));
        assertEq(factory.getDeployed(saltArbRelay), address(arbRelay));
        assertEq(factory.getDeployed(saltOpRelay), address(opRelay));
    }

    function test_initialize() public view {
        assertEq(orderlyRelay.owner(), delegate);
        assertEq(arbRelay.owner(), delegate);
        assertEq(opRelay.owner(), delegate);

        assertEq(address(orderlyRelay.endpoint()), address(endpoints[orderlyEid]));
        assertEq(address(arbRelay.endpoint()), address(endpoints[arbEid]));
        assertEq(address(opRelay.endpoint()), address(endpoints[opEid]));

        assertEq(orderlyRelay.ccManager(), address(orderlyManager));
        assertEq(arbRelay.ccManager(), address(arbManager));
        assertEq(opRelay.ccManager(), address(opManager));
    }

    function _set_factory() internal {
        factory = new ContractFactory(owner);
        address[] memory deployers = new address[](1);
        deployers[0] = delegate;
        bool knob = true;
        vm.prank(owner);
        factory.setDeployer(deployers, knob);
    }

    function _set_relays() internal {
        address relayImpl = address(new CrossChainRelayV2());
        bytes memory creationCode1 = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(
                relayImpl,
                abi.encodeWithSelector(CrossChainRelayV2.initialize.selector, endpoints[orderlyEid], delegate)
            )
        );
        bytes memory creationCode2 = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(
                relayImpl,
                abi.encodeWithSelector(CrossChainRelayV2.initialize.selector, endpoints[arbEid], delegate)
            )
        );
        bytes memory creationCode3 = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(
                relayImpl,
                abi.encodeWithSelector(CrossChainRelayV2.initialize.selector, endpoints[opEid], delegate)
            )
        );
        vm.startPrank(owner);
        orderlyRelay = CrossChainRelayV2(payable(factory.deploy(saltOrderlyRelay, creationCode1)));
        arbRelay = CrossChainRelayV2(payable(factory.deploy(saltArbRelay, creationCode2)));
        opRelay = CrossChainRelayV2(payable(factory.deploy(saltOpRelay, creationCode3)));
        vm.stopPrank();

        vm.deal(address(orderlyRelay), relayBalance);
        vm.deal(address(arbRelay), relayBalance);
        vm.deal(address(opRelay), relayBalance);

        vm.startPrank(delegate);
        // set chainId and eid
        orderlyRelay.addChainIdMapping(arbChainId, arbEid);
        orderlyRelay.addChainIdMapping(opChainId, opEid);
        arbRelay.addChainIdMapping(orderlyChainId, orderlyEid);
        opRelay.addChainIdMapping(orderlyChainId, orderlyEid);

        // set cc manager
        orderlyRelay.setCCManager(address(orderlyManager));
        arbRelay.setCCManager(address(arbManager));
        opRelay.setCCManager(address(opManager));

        // set lz option
        for (uint8 i = 0; i < uint8(CrossChainMethod.COUNT); i++) {
            orderlyRelay.setMethodOption(i, lzGas, 0);
        }

        orderlyRelay.setPeer(arbEid, addressToBytes32(address(arbRelay)));
        orderlyRelay.setPeer(opEid, addressToBytes32(address(opRelay)));
        arbRelay.setPeer(orderlyEid, addressToBytes32(address(orderlyRelay)));
        opRelay.setPeer(orderlyEid, addressToBytes32(address(orderlyRelay)));
        vm.stopPrank();
    }

    function test_pingpong() public {
        vm.startPrank(delegate);
        orderlyRelay.pingPong(arbChainId);
        vm.stopPrank();
    }
}
