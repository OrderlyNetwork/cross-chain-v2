import { MainnetV2EndpointId, TestnetV2EndpointId, Chain, ENVIRONMENT} from '@layerzerolabs/lz-definitions'


export const ENVS = ['dev', 'qa', 'staging', 'mainnet']

export const ORDERLY_TESTNET = 'orderlysepolia'
export const ORDERLY_MAINNET = 'orderly'

export const TEST_NETWORKS = ['arbitrumsepolia', 'opsepolia', 'amoy','basesepolia', 'mantlesepolia', 'sepolia', 'fuji', 'seitestnet', 'morphtestnet', 'sonictestnet', 'monadtestnet', ORDERLY_TESTNET] //
export const MAIN_NETWORKS = [ORDERLY_MAINNET] // 'arbitrum',  'optimism', 'polygon', 'base', 

export const TESTNET_ENDPOINT = '0x6EDCE65403992e310A62460808c4b910D972f10f'
export const MAINNET_ENDPOINT = '0x1a44076050125825900e736c501f859c50fE728c'

export const CONTRACT_TYPES = ['CrossChainRelayV2']

export const CC_RELAY_V2_ADDRESSES: Record<string, string> = {
    'dev': '0x84080B7BDF00ebAD06eDA7511Cb9415B0cBcc70c',
    'qa': '0x0000000000000000000000000000000000000000',
    'staging': '0x0000000000000000000000000000000000000000',
    'mainnet': '0x0000000000000000000000000000000000000000',
}


// Orderly has different multisig addresses for each environment
export const MULTISIG_ADDRESSES: Record<string, string> = {
    'dev': '0xFae9CAF31EeD9f6480262808920dA03eb7f76E7E',
    'qa': '0xc1465019B3e04602a50d34A558c6630Ac50f8fbb',
    'staging': '0x7D1e7BeAd9fBb72e35Dc8E6d1966c2e57DbDA3F0',
    'mainnet': '0x4e834Ca9310d7710a409638A7aa70CB22F141Df3',
}

// Orderly has different multisig addresses for on Morph testnet
export const MORPH_MULTISIG_ADDRESSES: Record<string, string> = {
    'dev': '0x2FEbfcB1bf24FFb4d22c925ba4Ef9Ab1EAb76b77',
    'qa': '0xC8Fe4672E533A806Ec02EDfeAd59B16aAF78Fc80',
    'staging': '0x1B2443349D9f023daD7D8ca3fdd5a3c335E84eB5',
    'mainnet': '0x4e834Ca9310d7710a409638A7aa70CB22F141Df3',
}

export const FACTORY_ADDRESSES: Record<string, string> = {
    'dev': '0x912e0bE5d0079d09AC9706E485d355B5Ae7Af638',
    'qa': '0x3C8ACD54f71F268B403Ff5E48a57C30775F0Aed6',
    'staging': '0xC243F4598e13fC4CaaEE31aA629337E90058a5c3',
    'mainnet': '0x63b5af2724018347a1747a504e45f4e4c5ad0d04',        // placeholder
}

type address = string
type LzConfig = {
    endpointAddress: address,
    endpointId: number,
    chainId: number,
    sendLibConfig?: {
        sendLibAddress: address,
        executorConfig: {
            executorAddress: address,
            maxMessageSize?: number,
        },
        ulnConfig: {
            confirmations?: number, 
            requiredDVNCount?: number, 
            optionalDVNCount?: number, 
            optionalDVNThreshold?: number, 
            requiredDVNs: address[],
            optionalDVNs?: address[],
        }
    },
    receiveLibConfig?: {
        receiveLibAddress: address,
        gracePeriod?: number,
        ulnConfig: {
            confirmations?: number, 
            requiredDVNCount?: number, 
            optionalDVNCount?: number, 
            optionalDVNThreshold?: number, 
            requiredDVNs: address[],
            optionalDVNs?: address[],
        }
    }
}

export const LZ_CONFIGS: Record<string, LzConfig> = {
    "arbitrumsepolia": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.ARBSEP_V2_TESTNET,
        chainId: 421614,
        sendLibConfig: {
            sendLibAddress: "0x4f7cd4DA19ABB31b0eC98b9066B9e857B1bf9C0E",
            executorConfig: {
                executorAddress: "0x5Df3a1cEbBD9c8BA7F8dF51Fd632A9aef8308897",
            },
            ulnConfig: {
                requiredDVNs: ["0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8"],
            }
        },
        receiveLibConfig: {
            receiveLibAddress: "0x75Db67CDab2824970131D5aa9CECfC9F69c69636",
            ulnConfig: {
                requiredDVNs: ["0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8"],
            }
        }
    },
    "opsepolia": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.OPTSEP_V2_TESTNET,
        chainId: 11155420,
        sendLibConfig: {
            sendLibAddress: "0xB31D2cb502E25B30C651842C7C3293c51Fe6d16f",
            executorConfig: {
                executorAddress: "0xDc0D68899405673b932F0DB7f8A49191491A5bcB",
            },
            ulnConfig: {
                requiredDVNs: ["0xd680ec569f269aa7015F7979b4f1239b5aa4582C"],
            }
        },
        receiveLibConfig: {
            receiveLibAddress: "0x9284fd59B95b9143AF0b9795CAC16eb3C723C9Ca",
            ulnConfig: {
                requiredDVNs: ["0xd680ec569f269aa7015F7979b4f1239b5aa4582C"],
            }
        }
    },
    "amoy": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.AMOY_V2_TESTNET,
        chainId: 80002,
        sendLibConfig: {
            sendLibAddress: "0x1d186C560281B8F1AF831957ED5047fD3AB902F9",
            executorConfig: {
                executorAddress: "0x4Cf1B3Fa61465c2c907f82fC488B43223BA0CF93",
            },
            ulnConfig: {
                requiredDVNs: ["0x55c175DD5b039331dB251424538169D8495C18d1"],
            }
        },
        receiveLibConfig: {
            receiveLibAddress: "0x53fd4C4fBBd53F6bC58CaE6704b92dB1f360A648",
            ulnConfig: {
                requiredDVNs: ["0x55c175DD5b039331dB251424538169D8495C18d1"],
            }
        }
    },
    "basesepolia": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.BASESEP_V2_TESTNET,
        chainId: 84532,
        sendLibConfig: {
            sendLibAddress: "0xC1868e054425D378095A003EcbA3823a5D0135C9",
            executorConfig: {
                executorAddress: "0x8A3D588D9f6AC041476b094f97FF94ec30169d3D",
            },
            ulnConfig: {
                requiredDVNs: ["0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6"],
            }
        },
        receiveLibConfig: {
            receiveLibAddress: "0x12523de19dc41c91F7d2093E0CFbB76b17012C8d",
            ulnConfig: {
                requiredDVNs: ["0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6"],
            }
        }
    },
    "mantlesepolia": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.MANTLESEP_V2_TESTNET,
        chainId: 5003,
    },
    "sepolia": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.SEPOLIA_V2_TESTNET,
        chainId: 11155111,
        sendLibConfig: {
            sendLibAddress: "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE",
            executorConfig: {
                executorAddress: "0x718B92b5CB0a5552039B593faF724D182A881eDA",
            },
            ulnConfig: {
                requiredDVNs: ["0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193"], //, 
            }
        },
        receiveLibConfig: {
            receiveLibAddress: "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851",
            ulnConfig: {
                requiredDVNs: ["0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193"], // 
            }
        }
    },
    "fuji": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.AVALANCHE_V2_TESTNET,
        chainId: 43113,
        sendLibConfig: {
            sendLibAddress: "0x69BF5f48d2072DfeBc670A1D19dff91D0F4E8170",
            executorConfig: {
                executorAddress: "0xa7BFA9D51032F82D649A501B6a1f922FC2f7d4e3",
            },
            ulnConfig: {
                requiredDVNs: ["0x9f0e79aeb198750f963b6f30b99d87c6ee5a0467"],
            }
        },
        receiveLibConfig: {
            receiveLibAddress: "0x819F0FAF2cb1Fba15b9cB24c9A2BDaDb0f895daf",
            ulnConfig: {
                requiredDVNs: ["0x9f0e79aeb198750f963b6f30b99d87c6ee5a0467"],
            }
        }
    },
    "seitestnet": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.SEI_V2_TESTNET,
        chainId: 713715,
    },
    "morphtestnet": {
        endpointAddress: "0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff",
        endpointId: TestnetV2EndpointId.MORPH_V2_TESTNET,
        chainId: 2810,
    },
    "sonictestnet": {
        endpointAddress: "0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff",
        endpointId: TestnetV2EndpointId.SONIC_V2_TESTNET,
        chainId: 57054,
    },
    "monadtestnet": {
        endpointAddress: "0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff",
        endpointId: TestnetV2EndpointId.MONAD_V2_TESTNET,
        chainId: 10143,
    },
    "orderlysepolia": {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.ORDERLY_V2_TESTNET,
        chainId: 4460,
        sendLibConfig: {
            sendLibAddress: "0x8e3Dc55b7A1f7Fe4ce328A1c90dC1B935a30Cc42",
            executorConfig: {
                executorAddress: "0x1e567E344B2d990D2ECDFa4e14A1c9a1Beb83e96",
            },
            ulnConfig: {
                requiredDVNs: ["0x175d2B829604b82270D384393D25C666a822ab60"],
            }
        },
        receiveLibConfig: {
            receiveLibAddress: "0x3013C32e5F45E69ceA9baD4d96786704C2aE148c",
            ulnConfig: {
                requiredDVNs: ["0x175d2B829604b82270D384393D25C666a822ab60"],
            }
        }
    },
}

export enum MethodOption {
    Deposit, // from vault to ledger
    Withdraw, // from ledger to vault
    WithdrawFinish, // from vault to ledger
    Ping, // for message testing
    PingPong, // ABA message testing
    RebalanceBurn, // burn request from ledger to vault
    RebalanceBurnFinish, // burn request finish from vault to ledger
    RebalanceMint, // mint request from ledger to vault
    RebalanceMintFinish, //  mint request finish from vault to ledger
    Withdraw2Contract 
}
export const METHOD_OPTIONS: Record<MethodOption, number> = {
    [MethodOption.Deposit]: 300_000,
    [MethodOption.Withdraw]: 400_000,
    [MethodOption.WithdrawFinish]: 200_000,
    [MethodOption.Ping]: 500_000,
    [MethodOption.PingPong]: 500_000,
    [MethodOption.RebalanceBurn]: 450_000,
    [MethodOption.RebalanceBurnFinish]: 280_000,
    [MethodOption.RebalanceMint]: 550_000,
    [MethodOption.RebalanceMintFinish]: 280_000,
    [MethodOption.Withdraw2Contract]: 500_000,
}

