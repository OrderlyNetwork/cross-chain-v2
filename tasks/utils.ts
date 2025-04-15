import * as constants from './const'


export function checkEnv(env: string) {
    if (constants.ENVS.includes(env)) {
        return env
    }
    throw new Error(`Invalid environment: ${env}, must be one of ${constants.ENVS.join(', ')}`)
}

export function checkContractType(contractType: string) {
    if (constants.CONTRACT_TYPES.includes(contractType)) {
        return contractType
    }
    throw new Error(`Invalid contract type: ${contractType}, must be one of ${constants.CONTRACT_TYPES.join(', ')}`)
}

export function getVaultCCManager(env: string, chain: string) {
    if (chain === 'orderlysepolia' || chain === 'orderly') {
        throw new Error(`Invalid chain: ${chain}, cannot be orderlysepolia or orderly`)
    }
    return constants.CC_MANAGERS[env][chain].vaultCCManager
}

export function getLedgerCCManager(env: string, chain: string) {
    if (chain !== 'orderlysepolia' && chain !== 'orderly') {
        throw new Error(`Invalid chain: ${chain}, must be orderlysepolia or orderly`)
    }
    return constants.CC_MANAGERS[env][chain].ledgerCCManager
}

export function getMultisigAddress(env: string, chain: string) {
    if (chain === 'morphtestnet') {
        return constants.MORPH_MULTISIG_ADDRESSES[env]
    }
    return constants.MULTISIG_ADDRESSES[env]
}

export function getFactoryAddress(env: string) {
    return constants.FACTORY_ADDRESSES[env]
}

export function getEndpoint(env: string) {
    if (env === 'mainnet') {
        return constants.MAINNET_ENDPOINT
    }
    return constants.TESTNET_ENDPOINT
}





