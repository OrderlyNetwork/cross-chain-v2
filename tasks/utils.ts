import * as constants from './const'
import path from 'path'
import fs from 'fs'


export function checkEnv(env: string) {
    if (constants.ENVS.includes(env)) {
        return env
    }
    throw new Error(`Invalid environment: ${env}, must be one of ${constants.ENVS.join(', ')}`)
}

export function checkNetwork(env: string, network: string) {
    if (env === 'mainnet') {
        if (constants.MAIN_NETWORKS.includes(network)) {
            return network
        } else {
            throw new Error(`Invalid network: ${network}, must be one of ${constants.MAIN_NETWORKS.join(', ')}`)
        }
    } else {
        if (constants.TEST_NETWORKS.includes(network)) {
            return network
        } else {
            throw new Error(`Invalid network: ${network}, must be one of ${constants.TEST_NETWORKS.join(', ')}`)
        }
    }
}

export function checkContractType(contractType: string) {
    if (constants.CONTRACT_TYPES.includes(contractType)) {
        return contractType
    }
    throw new Error(`Invalid contract type: ${contractType}, must be one of ${constants.CONTRACT_TYPES.join(', ')}`)
}


export function getMultisigAddress(env: string, chain: string) {
    if (chain === 'morphtestnet') {
        return constants.MORPH_MULTISIG_ADDRESSES[env]
    }
    return constants.MULTISIG_ADDRESSES[env]
}

export function getCCRelayV2Address(env: string) {
    return constants.CC_RELAY_V2_ADDRESSES[env]
}

export function getFactoryAddress(env: string) {
    return constants.FACTORY_ADDRESSES[env]
}

export function getEndpoint(env: string, network: string) {
    return constants.LZ_CONFIGS[network].endpointAddress
}

export function getNetworks(env: string) {
    if (env === 'mainnet') {
        return constants.MAIN_NETWORKS
    }
    return constants.TEST_NETWORKS
}

export function getEnvs() {
    return constants.ENVS
}

export function isOrderlyNetwork(network: string) {
    return network === 'orderly' || network === 'orderlysepolia'
}

export function getOrderlyNetwork(env: string) {
    if (env === 'mainnet') {
        return constants.ORDERLY_MAINNET
    }
    return constants.ORDERLY_TESTNET
}

export function getLzConfig(network: string) {
    return constants.LZ_CONFIGS[network]
}

export function getMethod() {
    return constants.MethodOption
}

export function getMethodOption(method: constants.MethodOption) {
    return constants.METHOD_OPTIONS[method]
}

export function isVaultRelayMethod(method: constants.MethodOption) {
    return ( method === constants.MethodOption.Deposit ||  
             method === constants.MethodOption.WithdrawFinish || 
             method === constants.MethodOption.RebalanceBurnFinish || 
             method === constants.MethodOption.RebalanceMintFinish || 
             method === constants.MethodOption.Withdraw2Contract ||
             method === constants.MethodOption.Ping || 
             method === constants.MethodOption.PingPong)
}

export function isLedgerRelayMethod(method: constants.MethodOption) {
    return (method === constants.MethodOption.Withdraw || 
            method === constants.MethodOption.RebalanceBurn ||  
            method === constants.MethodOption.RebalanceMint ||  
            method === constants.MethodOption.Withdraw2Contract ||
            method === constants.MethodOption.Ping || 
            method === constants.MethodOption.PingPong)
}

// Get orderly contracts address
export async function getOrderlyAddresses(env: string) {
    const orderlyContractsPath = path.join(__dirname, './asset/OrderlyContracts.json')
    const orderlyAddresses = JSON.parse(fs.readFileSync(orderlyContractsPath, "utf8"));
    return orderlyAddresses
}

export const PROPOSAL_FOLDER = path.join(__dirname, '../../safe-tasks/txn/CrossChain/')
export async function writeProposal(folderPath: string, proposal: any, proposalName: string) {
    if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder ${folderPath} does not exist`)
      }
      const files = fs.readdirSync(folderPath);

    const regex = /^N(\d{4})_.*\.json$/;
    const numbers = files
    .map(file => {
    const match = file.match(regex);
    return match ? parseInt(match[1], 10) : null;
    })
    .filter(num => num !== null) as number[];

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const newNum = maxNum + 1;
    const prefix = `N` + newNum.toString().padStart(4, '0') + `_`

      const fullPath = path.join(folderPath, prefix + proposalName);
      fs.writeFileSync(fullPath, JSON.stringify(proposal, null, 2), 'utf-8');
    
}

export function getLayerZeroScanLink(hash: string, isTestnet = true) {
    console.log(isTestnet ? `https://testnet.layerzeroscan.com/tx/${hash}` : `https://layerzeroscan.com/tx/${hash}`)
}





