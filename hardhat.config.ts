// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import '@layerzerolabs/toolbox-hardhat'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import "./tasks/tasks"

// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
      ? [PRIVATE_KEY]
      : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const config: HardhatUserConfig = {
    paths: {
        sources: "./contracts", // default
        artifacts: "./artifacts",
        cache: "./cache"
      },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        arbitrumsepolia: {
            eid: EndpointId.ARBSEP_V2_TESTNET,
            url: process.env.ARBITRUMSEPOLIA_RPC_URL,
            accounts,
        },
        opsepolia: {
            eid: EndpointId.OPTSEP_V2_TESTNET,
            url: process.env.OPSEPOLIA_RPC_URL,
            accounts,
        },
        amoy: {
            eid: EndpointId.AMOY_V2_TESTNET,
            url: process.env.AMOYSEPOLIA_RPC_URL,
            accounts,
          },
        basesepolia: {
            eid: EndpointId.BASESEP_V2_TESTNET,
            url: process.env.BASESEPOLIA_RPC_URL,
            accounts,
        },
        mantlesepolia: {
            eid: EndpointId.MANTLESEP_V2_TESTNET,
            url: process.env.MANTLESEPOLIA_RPC_URL,
            accounts,
        },
        sepolia: {
            eid: EndpointId.SEPOLIA_V2_TESTNET,
            url: process.env.SEPOLIA_RPC_URL,
            accounts,
        },
        fuji: {
            eid: EndpointId.AVALANCHE_V2_TESTNET,
            url: process.env.FUJI_RPC_URL,
            accounts,
        },
        seitestnet: {
            eid: EndpointId.SEI_V2_TESTNET,
            url: process.env.SEITESTNET_RPC_URL,
            accounts,
        },
        morphtestnet: {
            eid: EndpointId.MORPH_V2_TESTNET,
            url: process.env.MORPHTESTNET_RPC_URL,
            accounts,
        },
        sonictestnet: {
            eid: EndpointId.SONIC_V2_TESTNET,
            url: process.env.SONICTESTNET_RPC_URL,
            accounts,
        },
        monadtestnet: {
            eid: EndpointId.MONAD_V2_TESTNET,
            url: process.env.MONADTESTNET_RPC_URL,
            accounts,
        },
        // bsctestnet: {
        //     eid: EndpointId.BSC_V2_TESTNET,
        //     url: process.env.BSCTESTNET_RPC_URL,
        //     accounts,
        // },
        orderlysepolia: {
            eid: EndpointId.ORDERLY_V2_TESTNET,
            url: process.env.ORDERLYSEPOLIA_RPC_URL,
            accounts,
        },
        // mainnets
        ethereum: {
            eid: EndpointId.ETHEREUM_MAINNET,
            url: process.env.ETHEREUM_RPC_URL,
            accounts,
        },
        arbitrum: {
            eid: EndpointId.ARBITRUM_MAINNET,
            url: process.env.ARBITRUM_RPC_URL,
            accounts,
        },
        optimism: {
            eid: EndpointId.OPTIMISM_MAINNET,
            url: process.env.OPTIMISM_RPC_URL,
            accounts,
        },
        polygon: {
            eid: EndpointId.POLYGON_MAINNET,
            url: process.env.POLYGON_RPC_URL,
            accounts,
        },
        base: {
            eid: EndpointId.BASE_MAINNET,
            url: process.env.BASE_RPC_URL,
            accounts,
        },
        mantle: {
            eid: EndpointId.MANTLE_MAINNET,
            url: process.env.MANTLE_RPC_URL,
            accounts,
        },
        avax: {
            eid: EndpointId.AVALANCHE_MAINNET,
            url: process.env.AVAX_RPC_URL,
            accounts,
        },
        // snowtrace: {
        //     eid: EndpointId.AVALANCHE_MAINNET,
        //     url: 'https://api.avax-test.network/ext/bc/C/rpc',
        //     accounts,
        //   },
        // 
        sei: {
            eid: EndpointId.SEI_MAINNET,
            url: process.env.SEI_RPC_URL,
            accounts,
        },
        morph: {
            eid: EndpointId.MORPH_MAINNET,
            url: process.env.MORPH_RPC_URL,
            accounts,
        },
        sonic: {
            eid: EndpointId.SONIC_MAINNET,
            url: process.env.SONIC_RPC_URL,
            accounts,
        },

        bera: {
            eid: EndpointId.BERA_MAINNET,
            url: process.env.BERA_RPC_URL,
            accounts,
        },
        story: {
            eid: EndpointId.STORY_MAINNET,
            url: process.env.STORY_RPC_URL,
            accounts,
        },
        mode: {
            eid: EndpointId.MODE_MAINNET,
            url: process.env.MODE_RPC_URL,
            accounts,
        },
        orderly: {
            eid: EndpointId.ORDERLY_MAINNET,
            url: process.env.ORDERLY_RPC_URL,
            accounts,
        }
    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
}

export default config
