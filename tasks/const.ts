import { MainnetV2EndpointId, TestnetV2EndpointId, Chain, ENVIRONMENT } from '@layerzerolabs/lz-definitions'

export const ENVS = ['dev', 'qa', 'staging', 'mainnet']

export const ORDERLY_TESTNET = 'orderlysepolia'
export const ORDERLY_MAINNET = 'orderly'

export const TEST_NETWORKS = [
    'arbitrumsepolia',
    'opsepolia',
    'amoy',
    'basesepolia',
    'mantlesepolia',
    'sepolia',
    'fuji',
    'seitestnet',
    'morphtestnet',
    'sonictestnet',
    'monadtestnet',
    ORDERLY_TESTNET,
] //
export const MAIN_NETWORKS = [ORDERLY_MAINNET] // 'arbitrum',  'optimism', 'polygon', 'base',

export const TESTNET_ENDPOINT = '0x6EDCE65403992e310A62460808c4b910D972f10f'
export const MAINNET_ENDPOINT = '0x1a44076050125825900e736c501f859c50fE728c'

export const CONTRACT_TYPES = ['CrossChainRelayV2']

export const CC_RELAY_V2_ADDRESSES: Record<string, string> = {
    dev: '0x84080B7BDF00ebAD06eDA7511Cb9415B0cBcc70c',
    qa: '0xf366e3234CF777db58100b7aCCCdb6d84D366671',
    staging: '0x0000000000000000000000000000000000000000',
    mainnet: '0x0000000000000000000000000000000000000000',
}

// Orderly has different multisig addresses for each environment
export const MULTISIG_ADDRESSES: Record<string, string> = {
    dev: '0xFae9CAF31EeD9f6480262808920dA03eb7f76E7E',
    qa: '0xc1465019B3e04602a50d34A558c6630Ac50f8fbb',
    staging: '0x7D1e7BeAd9fBb72e35Dc8E6d1966c2e57DbDA3F0',
    mainnet: '0x4e834Ca9310d7710a409638A7aa70CB22F141Df3',
}

// Orderly has different multisig addresses for on Morph testnet
export const MORPH_MULTISIG_ADDRESSES: Record<string, string> = {
    dev: '0x2FEbfcB1bf24FFb4d22c925ba4Ef9Ab1EAb76b77',
    qa: '0xC8Fe4672E533A806Ec02EDfeAd59B16aAF78Fc80',
    staging: '0x1B2443349D9f023daD7D8ca3fdd5a3c335E84eB5',
    mainnet: '0x4e834Ca9310d7710a409638A7aa70CB22F141Df3',
}

export const FACTORY_ADDRESSES: Record<string, string> = {
    dev: '0x912e0bE5d0079d09AC9706E485d355B5Ae7Af638',
    qa: '0x3C8ACD54f71F268B403Ff5E48a57C30775F0Aed6',
    staging: '0xC243F4598e13fC4CaaEE31aA629337E90058a5c3',
    mainnet: '0x63b5af2724018347a1747a504e45f4e4c5ad0d04', // placeholder
}

type address = string
type LzConfig = {
    endpointAddress: address
    endpointId: number
    chainId: number
    sendLibConfig?: {
        sendLibAddress: address
        executorConfig: {
            executorAddress: address
            maxMessageSize?: number
        }
        ulnConfig: {
            confirmations?: number
            requiredDVNCount?: number
            optionalDVNCount?: number
            optionalDVNThreshold?: number
            requiredDVNs: address[]
            optionalDVNs?: address[]
        }
    }
    receiveLibConfig?: {
        receiveLibAddress: address
        gracePeriod?: number
        ulnConfig: {
            confirmations?: number
            requiredDVNCount?: number
            optionalDVNCount?: number
            optionalDVNThreshold?: number
            requiredDVNs: address[]
            optionalDVNs?: address[]
        }
    }
}

export const LZ_CONFIGS: Record<string, LzConfig> = {
    // Testnets
    arbitrumsepolia: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.ARBSEP_V2_TESTNET,
        chainId: 421614,
        sendLibConfig: {
            sendLibAddress: '0x4f7cd4DA19ABB31b0eC98b9066B9e857B1bf9C0E',
            executorConfig: {
                executorAddress: '0x5Df3a1cEbBD9c8BA7F8dF51Fd632A9aef8308897',
            },
            ulnConfig: {
                requiredDVNs: ['0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x75Db67CDab2824970131D5aa9CECfC9F69c69636',
            ulnConfig: {
                requiredDVNs: ['0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8'],
            },
        },
    },
    opsepolia: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.OPTSEP_V2_TESTNET,
        chainId: 11155420,
        sendLibConfig: {
            sendLibAddress: '0xB31D2cb502E25B30C651842C7C3293c51Fe6d16f',
            executorConfig: {
                executorAddress: '0xDc0D68899405673b932F0DB7f8A49191491A5bcB',
            },
            ulnConfig: {
                requiredDVNs: ['0xd680ec569f269aa7015F7979b4f1239b5aa4582C'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x9284fd59B95b9143AF0b9795CAC16eb3C723C9Ca',
            ulnConfig: {
                requiredDVNs: ['0xd680ec569f269aa7015F7979b4f1239b5aa4582C'],
            },
        },
    },
    amoy: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.AMOY_V2_TESTNET,
        chainId: 80002,
        sendLibConfig: {
            sendLibAddress: '0x1d186C560281B8F1AF831957ED5047fD3AB902F9',
            executorConfig: {
                executorAddress: '0x4Cf1B3Fa61465c2c907f82fC488B43223BA0CF93',
            },
            ulnConfig: {
                requiredDVNs: ['0x55c175DD5b039331dB251424538169D8495C18d1'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x53fd4C4fBBd53F6bC58CaE6704b92dB1f360A648',
            ulnConfig: {
                requiredDVNs: ['0x55c175DD5b039331dB251424538169D8495C18d1'],
            },
        },
    },
    basesepolia: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.BASESEP_V2_TESTNET,
        chainId: 84532,
        sendLibConfig: {
            sendLibAddress: '0xC1868e054425D378095A003EcbA3823a5D0135C9',
            executorConfig: {
                executorAddress: '0x8A3D588D9f6AC041476b094f97FF94ec30169d3D',
            },
            ulnConfig: {
                requiredDVNs: ['0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x12523de19dc41c91F7d2093E0CFbB76b17012C8d',
            ulnConfig: {
                requiredDVNs: ['0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6'],
            },
        },
    },
    mantlesepolia: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.MANTLESEP_V2_TESTNET,
        chainId: 5003,
        sendLibConfig: {
            sendLibAddress: '0x9A289B849b32FF69A95F8584a03343a33Ff6e5Fd',
            executorConfig: {
                executorAddress: '0x8BEEe743829af63F5b37e52D5ef8477eF12511dE',
            },
            ulnConfig: {
                requiredDVNs: ['0x9454f0eabc7c4ea9ebf89190b8bf9051a0468e03'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x8A3D588D9f6AC041476b094f97FF94ec30169d3D',
            ulnConfig: {
                requiredDVNs: ['0x9454f0eabc7c4ea9ebf89190b8bf9051a0468e03'],
            },
        },
    },
    sepolia: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.SEPOLIA_V2_TESTNET,
        chainId: 11155111,
        sendLibConfig: {
            sendLibAddress: '0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE',
            executorConfig: {
                executorAddress: '0x718B92b5CB0a5552039B593faF724D182A881eDA',
            },
            ulnConfig: {
                requiredDVNs: ['0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xdAf00F5eE2158dD58E0d3857851c432E34A3A851',
            ulnConfig: {
                requiredDVNs: ['0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193'],
            },
        },
    },
    fuji: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.AVALANCHE_V2_TESTNET,
        chainId: 43113,
        sendLibConfig: {
            sendLibAddress: '0x69BF5f48d2072DfeBc670A1D19dff91D0F4E8170',
            executorConfig: {
                executorAddress: '0xa7BFA9D51032F82D649A501B6a1f922FC2f7d4e3',
            },
            ulnConfig: {
                requiredDVNs: ['0x9f0e79aeb198750f963b6f30b99d87c6ee5a0467'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x819F0FAF2cb1Fba15b9cB24c9A2BDaDb0f895daf',
            ulnConfig: {
                requiredDVNs: ['0x9f0e79aeb198750f963b6f30b99d87c6ee5a0467'],
            },
        },
    },
    seitestnet: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.SEI_V2_TESTNET,
        chainId: 713715,
        sendLibConfig: {
            sendLibAddress: '0xd682ECF100f6F4284138AA925348633B0611Ae21',      // SendUln302
            executorConfig: {
                executorAddress: '0x55c175DD5b039331dB251424538169D8495C18d1', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0xf49d162484290eaead7bb8c2c7e3a6f8f52e32d6'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xcF1B0F4106B0324F96fEfcC31bA9498caa80701C',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0xf49d162484290eaead7bb8c2c7e3a6f8f52e32d6'],  // DVN
            },
        },
    },
    morphtestnet: {
        endpointAddress: '0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff',
        endpointId: TestnetV2EndpointId.MORPH_V2_TESTNET,
        chainId: 2810,
        sendLibConfig: {
            sendLibAddress: '0xd682ECF100f6F4284138AA925348633B0611Ae21',      // SendUln302
            executorConfig: {
                executorAddress: '0x701f3927871EfcEa1235dB722f9E608aE120d243', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0xf49d162484290eaead7bb8c2c7e3a6f8f52e32d6'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xcF1B0F4106B0324F96fEfcC31bA9498caa80701C',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0xf49d162484290eaead7bb8c2c7e3a6f8f52e32d6'],  // DVN
            },
        },

    },
    sonictestnet: {
        endpointAddress: '0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff',
        endpointId: TestnetV2EndpointId.SONIC_V2_TESTNET,
        chainId: 57054,
        sendLibConfig: {
            sendLibAddress: '0xd682ECF100f6F4284138AA925348633B0611Ae21',      // SendUln302
            executorConfig: {
                executorAddress: '0x9dB9Ca3305B48F196D18082e91cB64663b13d014', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0x88b27057a9e00c5f05dda29241027aff63f9e6e0'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xcF1B0F4106B0324F96fEfcC31bA9498caa80701C',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0x88b27057a9e00c5f05dda29241027aff63f9e6e0'],  // DVN
            },
        },
    },
    monadtestnet: {
        endpointAddress: '0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff',
        endpointId: TestnetV2EndpointId.MONAD_V2_TESTNET,
        chainId: 10143,
        sendLibConfig: {
            sendLibAddress: '0xd682ECF100f6F4284138AA925348633B0611Ae21',      // SendUln302
            executorConfig: {
                executorAddress: '0x9dB9Ca3305B48F196D18082e91cB64663b13d014', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0x88b27057a9e00c5f05dda29241027aff63f9e6e0'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xcF1B0F4106B0324F96fEfcC31bA9498caa80701C',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0x88b27057a9e00c5f05dda29241027aff63f9e6e0'],  // DVN
            },
        },
    },
    orderlysepolia: {
        endpointAddress: TESTNET_ENDPOINT,
        endpointId: TestnetV2EndpointId.ORDERLY_V2_TESTNET,
        chainId: 4460,
        sendLibConfig: {
            sendLibAddress: '0x8e3Dc55b7A1f7Fe4ce328A1c90dC1B935a30Cc42',
            executorConfig: {
                executorAddress: '0x1e567E344B2d990D2ECDFa4e14A1c9a1Beb83e96',
            },
            ulnConfig: {
                requiredDVNs: ['0x175d2B829604b82270D384393D25C666a822ab60'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x3013C32e5F45E69ceA9baD4d96786704C2aE148c',
            ulnConfig: {
                requiredDVNs: ['0x175d2B829604b82270D384393D25C666a822ab60'],
            },
        },
    },

    // Mainnets
    arbitrum: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.ARBITRUM_V2_MAINNET,
        chainId: 42161,
        sendLibConfig: {
            sendLibAddress: '0x975bcD720be66659e3EB3C0e4F1866a3020E493A',
            executorConfig: {
                executorAddress: '0x31CAe3B7fB82d847621859fb1585353c5720660D',
            },
            ulnConfig: {
                requiredDVNs: ['0x2f55C492897526677C5B68fb199ea31E2c126416'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x7B9E184e07a6EE1aC23eAe0fe8D6Be2f663f05e6',
            ulnConfig: {
                requiredDVNs: ['0x2f55C492897526677C5B68fb199ea31E2c126416'],
            },
        },
    },
    optimism: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.OPTIMISM_V2_MAINNET,
        chainId: 10,
        sendLibConfig: {
            sendLibAddress: '0x1322871e4ab09Bc7f5717189434f97bBD9546e95',
            executorConfig: {
                executorAddress: '0x2D2ea0697bdbede3F01553D2Ae4B8d0c486B666e',
            },
            ulnConfig: {
                requiredDVNs: ['0x6A02D83e8d433304bba74EF1c427913958187142'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x3c4962Ff6258dcfCafD23a814237B7d6Eb712063',
            ulnConfig: {
                requiredDVNs: ['0x6A02D83e8d433304bba74EF1c427913958187142'],
            },
        },
    },
    polygon: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.POLYGON_V2_MAINNET,
        chainId: 137,
        sendLibConfig: {
            sendLibAddress: '0x6c26c61a97006888ea9E4FA36584c7df57Cd9dA3',
            executorConfig: {
                executorAddress: '0xCd3F213AD101472e1713C72B1697E727C803885b',
            },
            ulnConfig: {
                requiredDVNs: ['0x23DE2FE932d9043291f870324B74F820e11dc81A'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x1322871e4ab09Bc7f5717189434f97bBD9546e95',
            ulnConfig: {
                requiredDVNs: ['0x23DE2FE932d9043291f870324B74F820e11dc81A'],
            },
        },
    },
    base: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.BASE_V2_MAINNET,
        chainId: 8453,
        sendLibConfig: {
            sendLibAddress: '0xB5320B0B3a13cC860893E2Bd79FCd7e13484Dda2',
            executorConfig: {
                executorAddress: '0x2CCA08ae69E0C44b18a57Ab2A87644234dAebaE4',
            },
            ulnConfig: {
                requiredDVNs: ['0x9e059a54699a285714207b43B055483E78FAac25'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf',
            ulnConfig: {
                requiredDVNs: ['0x9e059a54699a285714207b43B055483E78FAac25'],
            },
        },
    },
    mantle: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.MANTLE_V2_MAINNET,
        chainId: 5000,
        sendLibConfig: {
            sendLibAddress: '0xde19274c009A22921E3966a1Ec868cEba40A5DaC',      // SendUln302
            executorConfig: {
                executorAddress: '0x4Fc3f4A38Acd6E4cC0ccBc04B3Dd1CCAeFd7F3Cd', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0x28b6140ead70cb2fb669705b3598ffb4beaa060b'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0x8da6512De9379fBF4F09BF520Caf7a85435ed93e',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0x28b6140ead70cb2fb669705b3598ffb4beaa060b'],  // DVN
            },
        },
    },
    ethereum: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.ETHEREUM_V2_MAINNET,
        chainId: 1,
        sendLibConfig: {
            sendLibAddress: '0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1',
            executorConfig: {
                executorAddress: '0x173272739Bd7Aa6e4e214714048a9fE699453059',
            },
            ulnConfig: {
                requiredDVNs: ['0x589dEDbD617e0CBcB916A9223F4d1300c294236b'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xc02Ab410f0734EFa3F14628780e6e695156024C2',
            ulnConfig: {
                requiredDVNs: ['0x589dEDbD617e0CBcB916A9223F4d1300c294236b'],
            },
        },
    },
    avax: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.AVALANCHE_V2_MAINNET,
        chainId: 43114,
        sendLibConfig: {
            sendLibAddress: '0x197D1333DEA5Fe0D6600E9b396c7f1B1cFCc558a',
            executorConfig: {
                executorAddress: '0x90E595783E43eb89fF07f63d27B8430e6B44bD9c',
            },
            ulnConfig: {
                requiredDVNs: ['0x962f502a63f5fbeb44dc9ab932122648e8352959'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xbf3521d309642FA9B1c91A08609505BA09752c61',
            ulnConfig: {
                requiredDVNs: ['0x962f502a63f5fbeb44dc9ab932122648e8352959'],
            },
        },
    },
    sei: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.SEI_V2_MAINNET,
        chainId: 1329,
        sendLibConfig: {
            sendLibAddress: '0xC39161c743D0307EB9BCc9FEF03eeb9Dc4802de7',      // SendUln302
            executorConfig: {
                executorAddress: '0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0x6788f52439aca6bff597d3eec2dc9a44b8fee842'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0x6788f52439aca6bff597d3eec2dc9a44b8fee842'],  // DVN
            },
        },
    },
    morph: {
        endpointAddress: '0x6F475642a6e85809B1c36Fa62763669b1b48DD5B',
        endpointId: MainnetV2EndpointId.MORPH_V2_MAINNET,
        chainId: 2818,
        sendLibConfig: {
            sendLibAddress: '0xC39161c743D0307EB9BCc9FEF03eeb9Dc4802de7',      // SendUln302
            executorConfig: {
                executorAddress: '0xcCE466a522984415bC91338c232d98869193D46e', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0x6788f52439aca6bff597d3eec2dc9a44b8fee842'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0x6788f52439aca6bff597d3eec2dc9a44b8fee842'],  // DVN
            },
        },
    },
    sonic: {
        endpointAddress: '0x6F475642a6e85809B1c36Fa62763669b1b48DD5B',
        endpointId: MainnetV2EndpointId.SONIC_V2_MAINNET,
        chainId: 146,
        sendLibConfig: {
            sendLibAddress: '0xC39161c743D0307EB9BCc9FEF03eeb9Dc4802de7',      // SendUln302
            executorConfig: {
                executorAddress: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0x282b3386571f7f794450d5789911a9804fa346b4'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0x282b3386571f7f794450d5789911a9804fa346b4'],  // DVN
            },
        },
    },
    bera: {
        endpointAddress: '0x6F475642a6e85809B1c36Fa62763669b1b48DD5B',
        endpointId: MainnetV2EndpointId.BERA_V2_MAINNET,
        chainId: 80094,
        sendLibConfig: {
            sendLibAddress: '0xC39161c743D0307EB9BCc9FEF03eeb9Dc4802de7',      // SendUln302
            executorConfig: {
                executorAddress: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0x282b3386571f7f794450d5789911a9804fa346b4'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0x282b3386571f7f794450d5789911a9804fa346b4'],  // DVN
            },
        },
    },
    story: {
        endpointAddress: '0x3A73033C0b1407574C76BdBAc67f126f6b4a9AA9',
        endpointId: MainnetV2EndpointId.STORY_V2_MAINNET,
        chainId: 1514,
        sendLibConfig: {
            sendLibAddress: '0x2367325334447C5E1E0f1b3a6fB947b262F58312',      // SendUln302
            executorConfig: {
                executorAddress: '0x41Bdb4aa4A63a5b2Efc531858d3118392B1A1C3d', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0x9c061c9a4782294eef65ef28cb88233a987f4bdd'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xc1B621b18187F74c8F6D52a6F709Dd2780C09821',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0x9c061c9a4782294eef65ef28cb88233a987f4bdd'],  // DVN
            },
        },
    },
    mode: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.MODE_V2_MAINNET,
        chainId: 34443,
        sendLibConfig: {
            sendLibAddress: '0x2367325334447C5E1E0f1b3a6fB947b262F58312',      // SendUln302
            executorConfig: {
                executorAddress: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b', // LZ Executor
            },
            ulnConfig: {
                requiredDVNs: ['0xce8358bc28dd8296ce8caf1cd2b44787abd65887'],  // DVN
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xc1B621b18187F74c8F6D52a6F709Dd2780C09821',   // ReceiveUln302
            ulnConfig: {
                requiredDVNs: ['0xce8358bc28dd8296ce8caf1cd2b44787abd65887'],  // DVN
            },
        },
    },
    orderly: {
        endpointAddress: MAINNET_ENDPOINT,
        endpointId: MainnetV2EndpointId.ORDERLY_V2_MAINNET,
        chainId: 291,
        sendLibConfig: {
            sendLibAddress: '0x5B23E2bAe5C5f00e804EA2C4C9abe601604378fa',
            executorConfig: {
                executorAddress: '0x1aCe9DD1BC743aD036eF2D92Af42Ca70A1159df5',
            },
            ulnConfig: {
                requiredDVNs: ['0xF53857dbc0D2c59D5666006EC200cbA2936B8c35'],
            },
        },
        receiveLibConfig: {
            receiveLibAddress: '0xCFf08a35A5f27F306e2DA99ff198dB90f13DEF77',
            ulnConfig: {
                requiredDVNs: ['0xF53857dbc0D2c59D5666006EC200cbA2936B8c35'],
            },
        },
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
    Withdraw2Contract,
}
export const METHOD_OPTIONS: Record<MethodOption, number> = {
    [MethodOption.Deposit]: 300_000,
    [MethodOption.Withdraw]: 500_000,
    [MethodOption.WithdrawFinish]: 200_000,
    [MethodOption.Ping]: 500_000,
    [MethodOption.PingPong]: 500_000,
    [MethodOption.RebalanceBurn]: 450_000,
    [MethodOption.RebalanceBurnFinish]: 280_000,
    [MethodOption.RebalanceMint]: 550_000,
    [MethodOption.RebalanceMintFinish]: 280_000,
    [MethodOption.Withdraw2Contract]: 500_000,
}
