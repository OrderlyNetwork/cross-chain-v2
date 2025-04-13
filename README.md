# Orderly Cross-Chain Relay V2

The Orderly Cross-Chain Relay V2 is an OApp based on LayerZero V2, and used to connect Vault chains (Arbitrum, OP, Base, Ethereum, etc.) to the Ledger chain (Orderly L2).

## Architecture

To migrate from the previous version, we need to:

1. Deploy the new CrossChainRelayV2 contract on both Ledger and Vault chains.
2. Upgrade the [CCManager contracts](https://gitlab.com/orderlynetwork/orderly-v2/evm-cross-chain/-/tree/dev) on both Ledger and Vault chains.
3. Set Cross-Chain option on the CCManager contracts to enable the Relay V2.
4. Relay message through the new CrossChainRelayV2 contract.

The following diagram shows the architecture based on the new relay:

```
                         +---------+   LzV1    +---------+
                  +------+CCRelayV1+-----------+CCRelayV1+-----+
                  |      +---------+           +---------+     |
                  |                                            |
                  |                                            |
             +----+----+                                  +----+----+
+-------+    |  Vault  |                                  | Ledger  |     +--------+
| Vault +----+CCManager|                                  |CCManager+-----+ Ledger |
+-------+    +----+----+                                  +----+----+     +--------+
                  |                                            |
                  |                                            |
                  |      +---------+           +---------+     |
                  +------+CCRelayV2+-----------+CCRelayV2+-----+
                         +---------+   LzV2    +---------+
```

Note: To backward compatible for the inflight messages through the relay V1, we need to keep the CCManager contracts callable by both relay V1 and V2 for a while. Once the inflight messages are executed, we can disable the CCManager contracts callable by the relay V1.

## Deploy

To keep the Relay V2 contracts same address on all chains, we need to deploy the contracts via a factory contract using `Creat3` library from [solady](https://github.com/Vectorized/solady/blob/main/src/utils/CREATE3.sol).

The factory contract itself is deployed via another [deterministic factory](https://github.com/Arachnid/deterministic-deployment-proxy) contract `0x4e59b44847b379578588920ca78fbf26c0b4956c`

TODO @Zion

## Set Configuration

TODO @Zion

## Upgrade

TODO @Zion
