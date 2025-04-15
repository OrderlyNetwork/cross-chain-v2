import { MainnetV2EndpointId, TestnetV2EndpointId, Chain, ENVIRONMENT} from '@layerzerolabs/lz-definitions'


export const ENVS = ['dev', 'qa', 'staging', 'mainnet']

export const TEST_NETWORKS = ['arbitrumsepolia', 'opsepolia', 'amoy', 'basesepolia', 'orderlysepolia']
export const MAIN_NETWORKS = ['arbitrum', 'optimism', 'polygon', 'base', 'orderly']

export const TESTNET_ENDPOINT = '0x6EDCE65403992e310A62460808c4b910D972f10f'
export const MAINNET_ENDPOINT = '0x1a44076050125825900e736c501f859c50fE728c'

export const CONTRACT_TYPES = ['CrossChainRelayV2']

export const CC_MANAGERS: Record<string, Record<string, Record<string, string>>> = {
    'dev': {
        'arbitrumsepolia': {
            'vaultCCManager': '0xCf474548756Eb48A14D08Ca514F728f72a8F629D',
        },
        'opsepolia': {
            'vaultCCManager': '0xE8709025f99dd1B8533FB9b78Ca879Ee4ec7E70a',
        },
        'amoy': {
            'vaultCCManager': '0xCf474548756Eb48A14D08Ca514F728f72a8F629D',
        },
        'basesepolia': {
            'vaultCCManager': '0xCf474548756Eb48A14D08Ca514F728f72a8F629D',
        },
        'orderlysepolia': {
            'ledgerCCManager': '0xdecdf6f646d5cfaf16abf12222ccc84febae5934',
        },
    },
    'qa': {
        'arbitrumsepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'opsepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'amoy': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'basesepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'orderlysepolia': {
            'ledgerCCManager': '0x0000000000000000000000000000000000000000',
        },
        
    },
    'staging': {
        'arbitrumsepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'opsepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'amoy': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'basesepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'orderlysepolia': {
            'ledgerCCManager': '0x0000000000000000000000000000000000000000',
        },
        
    },
    'mainnet': {
        'arbitrumsepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'opsepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'amoy': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'basesepolia': {
            'vaultCCManager': '0x0000000000000000000000000000000000000000',
        },
        'orderlysepolia': {
            'ledgerCCManager': '0x0000000000000000000000000000000000000000',
        },
    }

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
    'dev': '0x2b1E9a839a873E05eeE8D90c6AfF7aA3E724E6cF',
    'qa': '0x2b1E9a839a873E05eeE8D90c6AfF7aA3E724E6cF',
    'staging': '0x2b1E9a839a873E05eeE8D90c6AfF7aA3E724E6cF',
    'mainnet': '0x63b5af2724018347a1747a504e45f4e4c5ad0d04',
}

