import { task, types } from "hardhat/config"
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { HardhatRuntimeEnvironment } from "hardhat/types"
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
        const networks = utils.getNetworks(env)
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const ccRelayV2 = await getContract(hre, 'CrossChainRelayV2', ccRelayV2Address, signer)
        let nonce = await signer.getTransactionCount()
        if (utils.isOrderlyNetwork(network)) {
            let eids = []
            let peers = []
            for (const remoteNetwork of networks) {
                if (!utils.isOrderlyNetwork(remoteNetwork)) {
                   console.log(`Setting ${network} to ${remoteNetwork}`)
                   const lzConfig = utils.getLzConfig(remoteNetwork)
                   const peerAddress = utils.getCCRelayV2Address(env)
                   const paddedPeerAddress = hre.ethers.utils.hexZeroPad(peerAddress, 32)
                   console.log('paddedPeerAddress', paddedPeerAddress)
                   const savedPeerAddress = await ccRelayV2.peers(lzConfig.endpointId)
                   console.log('savedPeerAddress', savedPeerAddress)
                   if (!samePeer(paddedPeerAddress, savedPeerAddress)) {
                    console.log('Peer not found, setting peer')
                    eids.push(lzConfig.endpointId)
                    peers.push(paddedPeerAddress)
                   } else {
                     console.log(`Peer on ${remoteNetwork} already set`)
                   }

                   const savedEid = await ccRelayV2.chainId2Eid(lzConfig.chainId)
                   if (savedEid !== lzConfig.endpointId) {
                    console.log('EID mismatch, setting EID')
                    const tx = await ccRelayV2.addChainIdMapping(lzConfig.chainId, lzConfig.endpointId, {nonce: nonce++})
                    const receipt = await tx.wait()
                    console.log(`Set ChainId and Eid for ${remoteNetwork}: ${receipt.transactionHash}`)
                   } else {
                    console.log(`ChainId and Eid for ${remoteNetwork} already set`)
                   }
                   
                }
                continue
            }

            if (eids.length > 0) {
                const tx = await ccRelayV2.setPeers(eids, peers, {nonce: nonce++})
                const receipt = await tx.wait()
                console.log('setPeers tx hash:', receipt.transactionHash)
               }
        } else {
            const remoteNetwork = utils.getOrderlyNetwork(env)
            const lzConfig = utils.getLzConfig(remoteNetwork)
            const peerAddress = utils.getCCRelayV2Address(env)
            const paddedPeerAddress = hre.ethers.utils.hexZeroPad(peerAddress, 32)
            const savedPeerAddress = await ccRelayV2.peers(lzConfig.endpointId)
            console.log('savedPeerAddress', savedPeerAddress)
            if (!samePeer(paddedPeerAddress, savedPeerAddress)) {
                console.log('Peer not found, setting peer')
                const tx = await ccRelayV2.setPeers([lzConfig.endpointId], [paddedPeerAddress], {nonce: nonce++})
                const receipt = await tx.wait()
                console.log(`Set peer for ${remoteNetwork}: ${receipt.transactionHash}`)
            } else {
                console.log(`Peer on ${remoteNetwork} already set`)
            }

            const savedEid = await ccRelayV2.chainId2Eid(lzConfig.chainId)
            if (savedEid !== lzConfig.endpointId) {
                console.log('EID mismatch, setting EID')
                const tx = await ccRelayV2.addChainIdMapping(lzConfig.chainId, lzConfig.endpointId, {nonce: nonce++})
                const receipt = await tx.wait()
                console.log(`Set ChainId and Eid for ${remoteNetwork}: ${receipt.transactionHash}`)
            } else {
                console.log(`ChainId and Eid for ${remoteNetwork} already set`)
            }
        }
        
        
    })

async function deployCCRelayV2Impl(env: string, hre: HardhatRuntimeEnvironment, signer: SignerWithAddress) {

    const CCRelayV2Name = 'CrossChainRelayV2'
    const CCRelayV2ImplAddress = await deployContract(hre, signer, CCRelayV2Name, [])
    console.log(`${CCRelayV2Name} contract deployed to ${CCRelayV2ImplAddress}`)

    return CCRelayV2ImplAddress
    
}

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

async function getContract(hre: HardhatRuntimeEnvironment, contract: string, address: string, signer: SignerWithAddress) {
    return await hre.ethers.getContractAt(contract, address, signer)
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

function getSalt(hre: HardhatRuntimeEnvironment, env: string) {
    return hre.ethers.utils.id(process.env.ORDER_DEPLOYMENT_SALT + `${env}` || "deterministicDeployment")
        
}


function samePeer(paddedPeerAddress: string, savedPeerAddress: string) {
    return paddedPeerAddress.toLowerCase() === savedPeerAddress.toLowerCase()
}