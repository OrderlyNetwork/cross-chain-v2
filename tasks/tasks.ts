import { task, types } from "hardhat/config"
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { Contract, ethers } from "ethers"
import * as utils from './utils'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import path from 'path'
import fs from 'fs'



task("order:deploy", "Deploys the contract to a specific network: CrossChainRelayV2")
    .addParam("env", "The environment to deploy the CrossChainRelayV2 contract", undefined, types.string)
    .addParam("contract", "The contract to deploy", undefined, types.string)
    .setAction(async (args, hre) => {
        const {env, contract} = args
        utils.checkEnv(env)
        utils.checkContractType(contract)
        const [signer] = await hre.ethers.getSigners()
        const salt = getSalt(hre, env)
        if (contract === 'CrossChainRelayV2') {
            const ccV2ImplAddress = await deployCCRelayV2Impl(env, hre, signer)
            const factory = await getFactoryContract(hre, env, signer)
            const lzEndpoint = utils.getEndpoint(env)
            const delegate = signer.address
            const proxyBytecode = await getCCRelayV2ProxyBytecode(hre, ccV2ImplAddress, signer, lzEndpoint, delegate)
            
            const tx = await factory.deploy(salt, proxyBytecode)
            const receipt = await tx.wait()
            console.log('deployed contract proxy with tx hash:', receipt.transactionHash)
            const proxyAddress = receipt.contractAddress
            console.log('relay v2 proxy address:', proxyAddress)
        } else {
            throw new Error(`Contract type ${contract} not supported`)
        }
        
    })


task("order:relayv2:set", "Connect CrossChainRelayV2 with each other between orderly chain and other chains")
    .addParam("env", "The environment to set peer", undefined, types.string)
    .setAction(async (args, hre) => {
        const {env} = args
        const network = hre.network.name
        utils.checkEnv(env)
        utils.checkNetwork(env, network)
        const [signer] = await hre.ethers.getSigners()
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const ccRelayV2 = await getContract(hre, 'CrossChainRelayV2', ccRelayV2Address, signer)
        
        await setPeer(hre, env, network, ccRelayV2, signer)
        await setChainId(hre, env, network, ccRelayV2, signer)
        await setCCManager(hre, env, network, ccRelayV2, signer)
        
    })


task("order:relayv2:setoptions", "Set the options of CrossChainRelayV2")
    .addParam("env", "The environment to set options", undefined, types.string)
    .setAction(async (args, hre) => {
        const {env} = args
        utils.checkEnv(env)
        const network = hre.network.name
        const [signer] = await hre.ethers.getSigners()
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const ccRelayV2 = await getContract(hre, 'CrossChainRelayV2', ccRelayV2Address, signer)
        const methods = utils.getMethod()

        const methodsNames = Object.keys(methods).filter(k => isNaN(Number(k)));
        for (const method of methodsNames) {
            const methodIndex = methods[method as keyof typeof methods]
            console.log(utils.getMethodOption(methodIndex))
            console.log(methodIndex)
            if (utils.isLedgerRelayMethod(methodIndex)) {
                // TODO: set ledger relay config
            } else if (utils.isVaultRelayMethod(methodIndex)) {
                // TODO: set vault relay config
            }
        }

        
    })

task("order:relayv2:getconfig", "Get the config of CrossChainRelayV2")
    .addParam("env", "The environment to get config", undefined, types.string)
    .setAction(async (args, hre) => {
        const {env} = args
        utils.checkEnv(env)
        const network = hre.network.name
        const [signer] = await hre.ethers.getSigners()
        const endpointV2 = await getEndpointV2Contract(hre, signer)
        if (utils.isOrderlyNetwork(network)) {
            await printLedgerRelayConfig(hre, env, signer, endpointV2)
        } else {
            await printVaultRelayConfig(hre, env, signer, endpointV2)
        }

    })

task("order:relayv2:setconfig", "Set the config of CrossChainRelayV2")
    .addParam("env", "The environment to set config", undefined, types.string)
    .setAction(async (args, hre) => {
        const {env} = args
        utils.checkEnv(env)
        // TODO: set config for mainnet
    })

task("order:manager:upgrade", "Generate the proposal to upgrade the CCManager and set config")
    .addParam("env", "The environment to upgrade the CCManager", undefined, types.string)
    .setAction(async (args, hre) => {
        const {env} = args
        utils.checkEnv(env)
        const network = hre.network.name
        const orderlyAddresses = await utils.getOrderlyAddresses(env)
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const [signer] = await hre.ethers.getSigners()
        const ccManager = await getCCManagerContract(hre, env, network, signer)
        
        const proposalUpgrade = {
            "_description": "Upgrade the CCManager",
            "to": `${orderlyAddresses[env][network].CCManager}`,
            "value": "0",
            "method": "upgradeTo(address)",
            "params": [`${orderlyAddresses[env][network].CCManagerImplV2}`],
            "operation": 0
        }
       
        
        const proposalSetRelayV1Status = {
            "_description": "Set the relay status of CrossChainRelayV1",
            "to": `${orderlyAddresses[env][network].CCManager}`,
            "value": "0",
            "method": "setRelayStatus(address,bool)",
            "params": [`${orderlyAddresses[env][network].CCRelayV1}`, true],
            "operation": 0
        }
        
        const proposalSetRelayV2Address = {
            "_description": "Set the address of CrossChainRelayV2",
            "to": `${orderlyAddresses[env][network].CCManager}`,
            "value": "0",
            "method": "setCrossChainRelayV2(address)",
            "params": [`${ccRelayV2Address}`],
            "operation": 0
        }
    
        const proposalSetRelayV2Status = {
            "_description": "Set the relaystatus of CrossChainRelayV2",
            "to": `${orderlyAddresses[env][network].CCManager}`,
            "value": "0",
            "method": "setRelayStatus(address,bool)",
            "params": [`${ccRelayV2Address}`, true],
            "operation": 0
        }        
        
        const proposals = [proposalUpgrade, proposalSetRelayV1Status, proposalSetRelayV2Address, proposalSetRelayV2Status]
        console.log(JSON.stringify(proposals, null, 2))
    })

task("order:manager:relayoption", "Propose to enable CrossChainRelayV2 as the default relay")
    .addParam("env", "The environment to set CrossChainRelayV2 as the default relay", undefined, types.string)
    .setAction(async (args, hre) => {
        const {env} = args
        utils.checkEnv(env)
        const [signer] = await hre.ethers.getSigners()
        const network = hre.network.name
        const ccManager = await getCCManagerContract(hre, env, network, signer)
        let proposals = []
        if (utils.isOrderlyNetwork(network)) {
            const networks = utils.getNetworks(env)
            for (const vaultNetwork of networks) {
                if (!utils.isOrderlyNetwork(vaultNetwork)) {
                    const lzConfig = utils.getLzConfig(vaultNetwork)
                    const relayOption = await ccManager.ccRelayOption(lzConfig.chainId)
                    
                    if (relayOption !== 1) {
                        const proposalSetRelayOption = {
                            "_description": "Set the relay option of CrossChainRelayV2",
                            "to": `${ccManager.address}`,
                            "value": "0",
                            "method": "setCCRelayOption(uint256,uint8)",
                            "params": [lzConfig.chainId, 1],
                            "operation": 0
                        }
                        proposals.push(proposalSetRelayOption)
                    } else {
                        console.log(`✅ Relay option to V2 to ${vaultNetwork} already set`)
                    }
                }
            }
        } else {
            const relayOption = await ccManager.ccRelayOption()
            if (relayOption !== 1) {
                const proposalSetRelayOption = {
                    "_description": "Set the relay option of CrossChainRelayV2",
                    "to": `${ccManager.address}`,
                    "value": "0",
                    "method": "setCCRelayOption(uint8)",
                    "params": [1],
                    "operation": 0
                }
                proposals.push(proposalSetRelayOption)
            } else {
                console.log(`✅ Relay option to V2 for ${network} already set`)
            }
            
        }
        console.log(JSON.stringify(proposals, null, 2))  
    })

// Deploy the CrossChainRelayV2 contract implementation
async function deployCCRelayV2Impl(env: string, hre: HardhatRuntimeEnvironment, signer: SignerWithAddress) {

    const CCRelayV2Name = 'CrossChainRelayV2'
    const CCRelayV2ImplAddress = await deployContract(hre, signer, CCRelayV2Name, [])
    console.log(`${CCRelayV2Name} contract implementation deployed to ${CCRelayV2ImplAddress}`)

    return CCRelayV2ImplAddress
    
}

// Deploy a contract to a specific network
async function deployContract(hre: HardhatRuntimeEnvironment, signer: SignerWithAddress, contract: string, args: any[]) {
    const { deploy } = hre.deployments;
    const baseDeployArgs = {
        from: signer.address,
        log: true,
    };
    const deployedContract = await deploy(contract, {
        ...baseDeployArgs,
        args: args
    })
    const contractAddress = deployedContract.address
    return contractAddress
}

async function deployContractWithProxy(hre: HardhatRuntimeEnvironment, signer: SignerWithAddress, contract: string, args: any[]) {
    // TODO
}

async function deployContractDeterministic(hre: HardhatRuntimeEnvironment, signer: SignerWithAddress, contract: string, args: any[], salt: string) {
    // TODO
}

// Get the factory contract which can deploy the proxy contract using `create3`
async function getFactoryContract(hre: HardhatRuntimeEnvironment, env: string, signer: SignerWithAddress) {
    const factoryContractPath = path.join(__dirname, './asset/Factory.json')
    const artifact = JSON.parse(fs.readFileSync(factoryContractPath, "utf8"));
    const factoryAddress = utils.getFactoryAddress(env)
    const factory = await hre.ethers.getContractAt(artifact.abi, factoryAddress, signer)
    return factory
}



// Get the contract instance within the contracts folder
async function getContract(hre: HardhatRuntimeEnvironment, contract: string, address: string, signer: SignerWithAddress) {
    return await hre.ethers.getContractAt(contract, address, signer)
}

async function getCCManagerContract(hre: HardhatRuntimeEnvironment, env: string, network: string, signer: SignerWithAddress) {
    const orderlyAddresses = await utils.getOrderlyAddresses(env)
    const ccManagerAddress = orderlyAddresses[env][network].CCManager
    let ccManagerAbiPath = ''
    if (utils.isOrderlyNetwork(network)) {
        ccManagerAbiPath = path.join(__dirname, './asset/LedgerCCManagerV2.json')
    } else {
        ccManagerAbiPath = path.join(__dirname, './asset/VaultCCManagerV2.json')
    }

    const artifact = JSON.parse(fs.readFileSync(ccManagerAbiPath, "utf8"));
    const ccManager = await hre.ethers.getContractAt(artifact.abi, ccManagerAddress, signer)
    return ccManager
}

const EXECUTOR_CONFIG_STRUCT = "tuple(uint32 maxMessageSize, address executorAddress)"
// const EXECUTOR_CONFIG_STRUCT = ["uint32","address"]
const ULN_CONFIG_STRUCT = "tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)"
// const ULN_CONFIG_STRUCT = ["uint64","uint8","uint8","uint8","address[]","address[]"]


const CONFIG_TYPE_EXECUTOR = 1
const CONFIG_TYPE_ULN = 2

// Get the EndpointV2 contract instance
async function getEndpointV2Contract(hre: HardhatRuntimeEnvironment, signer: SignerWithAddress) {
    const endpointV2Deployment = await hre.deployments.get('EndpointV2')
    const endpointV2Contract = await hre.ethers.getContractAt(endpointV2Deployment.abi, endpointV2Deployment.address, signer)
    return endpointV2Contract
}

// Print the config of CrossChainRelayV2 on orderly chain
async function printLedgerRelayConfig(hre: HardhatRuntimeEnvironment, env: string, signer: SignerWithAddress, endpointV2: Contract) {
    const relayV2Address = utils.getCCRelayV2Address(env)
    for (const network of utils.getNetworks(env)) {
        if (!utils.isOrderlyNetwork(network)) {
            await printConfig(hre, endpointV2, relayV2Address, network)
        }
        continue
    }
}

// Print the config of CrossChainRelayV2 on vault chain
async function printVaultRelayConfig(hre: HardhatRuntimeEnvironment, env: string, signer: SignerWithAddress, endpointV2: Contract) {
    const relayV2Address = utils.getCCRelayV2Address(env)
    for (const network of utils.getNetworks(env)) {
        if (!utils.isOrderlyNetwork(network)) {
            continue
        }
        await printConfig(hre, endpointV2, relayV2Address, network)
        
    }
}

// Print the config of CrossChainRelayV2 on a specific chain
async function printConfig(hre: HardhatRuntimeEnvironment, endpointV2: Contract, relayV2Address: string, dstNetwork: string) {
    const lzConfig = utils.getLzConfig(dstNetwork)
    const defaultSendLib = await endpointV2.defaultSendLibrary(lzConfig.endpointId)
    const defaultReceiveLib = await endpointV2.defaultReceiveLibrary(lzConfig.endpointId)
    const onchainSendLibConfigExecutor = await endpointV2.getConfig(relayV2Address, defaultSendLib, lzConfig.endpointId, CONFIG_TYPE_EXECUTOR)
    const onchainSendLibConfigULN = await endpointV2.getConfig(relayV2Address, defaultSendLib, lzConfig.endpointId, CONFIG_TYPE_ULN)
    const onchainReceiveLibConfigULN = await endpointV2.getConfig(relayV2Address, defaultReceiveLib, lzConfig.endpointId, CONFIG_TYPE_ULN)
    const [decodeSendLibConfigExecutor] = hre.ethers.utils.defaultAbiCoder.decode([EXECUTOR_CONFIG_STRUCT], onchainSendLibConfigExecutor)
    const [decodeSendLibConfigULN] = hre.ethers.utils.defaultAbiCoder.decode([ULN_CONFIG_STRUCT], onchainSendLibConfigULN)
    const [decodeReceiveLibConfigULN] = hre.ethers.utils.defaultAbiCoder.decode([ULN_CONFIG_STRUCT], onchainReceiveLibConfigULN)

    console.log(`=================Print Config for pathway to ${dstNetwork}===================`)
    console.log(`Default SendLib: ${defaultSendLib}`)
    console.log(`Onchain SendLibConfigExecutor: \n maxMessageSize: ${decodeSendLibConfigExecutor[0]},\n executor: ${decodeSendLibConfigExecutor[1]}`)
    console.log(`Onchain SendLibConfigULN: \n confirmations: ${decodeSendLibConfigULN[0]}, \n requiredDVNCount: ${decodeSendLibConfigULN[1]}, \n optionalDVNCount: ${decodeSendLibConfigULN[2]}, \n optionalDVNThreshold: ${decodeSendLibConfigULN[3]}, \n requiredDVNs: ${decodeSendLibConfigULN[4]}, \n optionalDVNs: ${decodeSendLibConfigULN[5]} \n`)
    
    console.log(`Default ReceiveLib: ${defaultReceiveLib}`)
    console.log(`Onchain ReceiveLibConfigULN: \n confirmations: ${decodeReceiveLibConfigULN[0]}, \n requiredDVNCount: ${decodeReceiveLibConfigULN[1]}, \n optionalDVNCount: ${decodeReceiveLibConfigULN[2]}, \n optionalDVNThreshold: ${decodeReceiveLibConfigULN[3]}, \n requiredDVNs: ${decodeReceiveLibConfigULN[4]}, \n optionalDVNs: ${decodeReceiveLibConfigULN[5]} \n`)
}

async function getCCRelayV2ProxyBytecode(hre: HardhatRuntimeEnvironment, ccV2ImplAddress: string, signer: SignerWithAddress, lzEndpoint: string, delegate: string) {
    const ccV2Contract = await getContract(hre, 'CrossChainRelayV2', ccV2ImplAddress, signer)
    const ccV2InitData = ccV2Contract.interface.encodeFunctionData('initialize', [lzEndpoint, delegate])
    const constructorArgs = hre.ethers.utils.defaultAbiCoder.encode(
        ['address', 'bytes'],
        [ccV2ImplAddress, ccV2InitData]
    )

    const erc1967ProxyPath = path.join(__dirname, './asset/ERC1967Proxy.json')
    const erc1967ProxyArtifact = JSON.parse(fs.readFileSync(erc1967ProxyPath, "utf8"));
    const proxyBytecode = hre.ethers.utils.concat([
        erc1967ProxyArtifact.bytecode,
        constructorArgs
    ])
    return proxyBytecode
}

async function setPeer(hre: HardhatRuntimeEnvironment, env: string, network: string, ccRelayV2: Contract, signer: SignerWithAddress) {
    const networks = utils.getNetworks(env)

    let nonce = await signer.getTransactionCount()
        if (utils.isOrderlyNetwork(network)) {
            let eids = []
            let peers = []
            for (const remoteNetwork of networks) {
                // check if the remote network is vault chain
                if (!utils.isOrderlyNetwork(remoteNetwork)) {
                //    console.log(`Setting ${network} to ${remoteNetwork}`)
                   const lzConfig = utils.getLzConfig(remoteNetwork)
                   const peerAddress = utils.getCCRelayV2Address(env)
                   const paddedPeerAddress = hre.ethers.utils.hexZeroPad(peerAddress, 32)
                //    console.log('paddedPeerAddress', paddedPeerAddress)
                   const savedPeerAddress = await ccRelayV2.peers(lzConfig.endpointId)
                //    console.log('savedPeerAddress', savedPeerAddress)
                   if (!samePeer(paddedPeerAddress, savedPeerAddress)) {
                    console.log('Peer is not set, setting peer')
                    eids.push(lzConfig.endpointId)
                    peers.push(paddedPeerAddress)
                   } else {
                     console.log(`✅ Peer to ${remoteNetwork} already set`)
                   }  
                }
                continue
            }

            if (eids.length > 0) {
                const tx = await ccRelayV2.setPeers(eids, peers, {nonce: nonce++})
                const receipt = await tx.wait()
                console.log(`✅ Set peers to vault chains: ${receipt.transactionHash}`)
               }
        } else {
            const ordderlyNetwork = utils.getOrderlyNetwork(env)
            const lzConfig = utils.getLzConfig(ordderlyNetwork)
            const peerAddress = utils.getCCRelayV2Address(env)
            const paddedPeerAddress = hre.ethers.utils.hexZeroPad(peerAddress, 32)
            const savedPeerAddress = await ccRelayV2.peers(lzConfig.endpointId)
            // console.log('savedPeerAddress', savedPeerAddress)
            if (!samePeer(paddedPeerAddress, savedPeerAddress)) {
                console.log('Peer not set, setting peer')
                const tx = await ccRelayV2.setPeer(lzConfig.endpointId, paddedPeerAddress, {nonce: nonce++})
                const receipt = await tx.wait()
                console.log(`✅ Set peer to ${ordderlyNetwork}: ${receipt.transactionHash}`)
            } else {
                console.log(`✅ Peer to ${ordderlyNetwork} already set`)
            }

            
        }
}

async function setChainId(hre: HardhatRuntimeEnvironment, env: string, network: string, ccRelayV2: Contract, signer: SignerWithAddress) {
    
    const networks = utils.getNetworks(env)

    let nonce = await signer.getTransactionCount()
    if (utils.isOrderlyNetwork(network)) {
        for (const remoteNetwork of networks) {
            if (!utils.isOrderlyNetwork(remoteNetwork)) {
                const lzConfig = utils.getLzConfig(remoteNetwork)
                const savedEid = await ccRelayV2.chainId2Eid(lzConfig.chainId)
                if (savedEid !== lzConfig.endpointId) {
                    console.log('EID mismatch, setting EID')
                    const tx = await ccRelayV2.addChainIdMapping(lzConfig.chainId, lzConfig.endpointId, {nonce: nonce++})
                    const receipt = await tx.wait()
                    console.log(`✅ Set ChainId and Eid to ${remoteNetwork}: ${receipt.transactionHash}`)
                } else {
                    console.log(`✅ ChainId and Eid to ${remoteNetwork} already set`)
                }
            }
            continue
        }
    } else {
        const ordderlyNetwork = utils.getOrderlyNetwork(env)
        const lzConfig = utils.getLzConfig(ordderlyNetwork)

        const savedEid = await ccRelayV2.chainId2Eid(lzConfig.chainId)
        if (savedEid !== lzConfig.endpointId) {
            console.log('EID mismatch, setting EID')
            const tx = await ccRelayV2.addChainIdMapping(lzConfig.chainId, lzConfig.endpointId, {nonce: nonce++})
            const receipt = await tx.wait()
            console.log(`✅ Set ChainId and Eid to ${ordderlyNetwork}: ${receipt.transactionHash}`)
        } else {
            console.log(`✅ ChainId and Eid to ${ordderlyNetwork} already set`)
        }

    }
}

async function setCCManager(hre: HardhatRuntimeEnvironment, env: string, network: string, ccRelayV2: Contract, signer: SignerWithAddress) {
    const orderlyAddresses = await utils.getOrderlyAddresses(env)
    // console.log('orderlyAddresses', orderlyAddresses)
    const ccManagerAddress = orderlyAddresses[env][network].CCManager
    const savedCCManagerAddress = await ccRelayV2.ccManager()
    // console.log('savedCCManagerAddress', savedCCManagerAddress)
    let nonce = await signer.getTransactionCount()
    if (savedCCManagerAddress.toLowerCase() !== ccManagerAddress.toLowerCase()) {
        console.log('CCManager mismatch, setting CCManager')
        const tx = await ccRelayV2.setCCManager(ccManagerAddress, {nonce: nonce++})
        const receipt = await tx.wait()
        console.log(`✅ Set CCManager on ${network}: ${receipt.transactionHash}`)
    } else {
        console.log(`✅ CCManager on ${network} already set`)
    }
}

async function getImplAddress(hre: HardhatRuntimeEnvironment, env: string, proxyAddress: string) {
    const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
    const storage = await hre.ethers.provider.getStorageAt(proxyAddress, IMPLEMENTATION_SLOT)
    const implAddress = await hre.ethers.utils.getAddress('0x' + storage.slice(26)); // 取最后20字节
    return implAddress
}

function getSalt(hre: HardhatRuntimeEnvironment, env: string) {
    return hre.ethers.utils.id(process.env.ORDER_DEPLOYMENT_SALT + `${env}` || "deterministicDeployment")
        
}


function samePeer(paddedPeerAddress: string, savedPeerAddress: string) {
    return paddedPeerAddress.toLowerCase() === savedPeerAddress.toLowerCase()
}
