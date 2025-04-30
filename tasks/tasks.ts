import { task, types } from 'hardhat/config'
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Contract, ethers } from 'ethers'
import * as utils from './utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import path from 'path'
import fs from 'fs'

task('order:deploy', 'Deploys the contract to a specific network: CrossChainRelayV2')
    .addParam('env', 'The environment to deploy the CrossChainRelayV2 contract', undefined, types.string)
    .addParam('contract', 'The contract to deploy', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env, contract } = args
        utils.checkEnv(env)
        utils.checkContractType(contract)
        utils.checkNetwork(env, hre.network.name)
        const [signer] = await hre.ethers.getSigners()
        const endpointV2 = await getEndpointV2Contract(hre, signer)
        const salt = getSalt(hre, env)
        if (contract === 'CrossChainRelayV2') {
            const ccV2ImplAddress = await deployCCRelayV2Impl(env, hre, signer) //await deployCCRelayV2Impl(env, hre, signer)
            await utils.saveContractAddress(env, hre.network.name, 'CCRelayV2Impl', ccV2ImplAddress)
            const factory = await getFactoryContract(hre, env, signer)
            // const  = utils.getEndpoint(env, hre.network.name)
            const lzEndpointAddress = endpointV2.address
            console.log(`lzEndpointAddress: ${lzEndpointAddress}`)
            const delegate = signer.address
            const proxyBytecode = await getCCRelayV2ProxyBytecode(
                hre,
                ccV2ImplAddress,
                signer,
                lzEndpointAddress,
                delegate
            )

            const tx = await factory.deploy(salt, proxyBytecode)
            const receipt = await tx.wait()
            console.log('deployed contract proxy with tx hash:', receipt.transactionHash)
            // const proxyAddress = receipt.contractAddress
            console.log('relay v2 proxy address:', receipt.logs[0].address) // fix null output
        } else {
            throw new Error(`Contract type ${contract} not supported`)
        }
    })

task('quick:deploy', 'Quickly deploy the contract to all supported networks: CrossChainRelayV2')
    .addParam('env', 'The environment to deploy the CrossChainRelayV2 contract', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const networks = utils.getNetworks(env)
        const artifact = await hre.artifacts
        const salt = getSalt(hre, env)
        for (const network of networks) {
            const lzConfig = utils.getLzConfig(network)
            const [signer, provider] = getNetworkSignerAndProvider(hre, network)
            const factory = await getFactoryContract(hre, env, signer)
            const ccV2Facotry = new hre.ethers.ContractFactory(
                (await artifact.readArtifact('CrossChainRelayV2')).abi,
                (await artifact.readArtifact('CrossChainRelayV2')).bytecode,
                signer
            )
            const ccV2Impl = utils.isPolygonNetwork(network)
                ? await ccV2Facotry.deploy({ gasPrice: 30000000000 })
                : await ccV2Facotry.deploy() // {gasPrice: 30000000000}
            await ccV2Impl.deployed()
            const ccV2ImplAddress = ccV2Impl.address
            await utils.saveContractAddress(env, hre.network.name, 'CCRelayV2Impl', ccV2ImplAddress)
            console.log(`deployed ccV2Impl Address on ${padString(network, 15)}: ${ccV2ImplAddress}`)
            const endpointV2Address = lzConfig.endpointAddress
            console.log(`endpointV2Address: ${endpointV2Address}`)

            const delegate = signer.address
            console.log(`delegate: ${delegate}`)
            const proxyBytecode = await getCCRelayV2ProxyBytecode(
                hre,
                ccV2ImplAddress,
                signer,
                endpointV2Address,
                delegate
            )
            const tx = utils.isPolygonNetwork(network)
                ? await factory.deploy(salt, proxyBytecode, { gasPrice: 30000000000 })
                : await factory.deploy(salt, proxyBytecode) // , {gasPrice: 30000000000}
            const receipt = await tx.wait()
            console.log('deployed contract proxy with tx hash:', receipt.transactionHash)
            console.log('relay v2 proxy address:', receipt.logs[0].address) // fix null output
        }
    })

task('order:getaddress', 'Get the address of CrossChainRelayV2')
    .addParam('env', 'The environment to get address', undefined, types.string)
    .addParam('salt', 'The salt to get address', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const network = hre.network.name
        const [signer] = await hre.ethers.getSigners()
        const factory = await getFactoryContract(hre, env, signer)
        const salt = hre.ethers.utils.id(args.salt + `${env}` || 'deterministicDeployment')
        const isManager = await factory.isManager(signer.address)
        if (!isManager) {
            console.log(
                `❗ ${signer.address} is not a manager for the factory contract ${factory.address} on ${network} ${env}`
            )
        } else {
            console.log(
                `✅ ${signer.address} is a manager for the factory contract ${factory.address} on ${network} ${env}`
            )
        }
        const predicateAddress = await factory.getDeployed(salt)
        console.log(`Predicted address for your salt: ${predicateAddress}`)
    })

task('quick:getaddress', 'Quickly get the address of CrossChainRelayV2')
    .addParam('env', 'The environment to get address', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)

        const networks = utils.getNetworks(env)
        for (const network of networks) {
            const [signer, provider] = getNetworkSignerAndProvider(hre, network)
            const factory = await getFactoryContract(hre, env, signer)
            const isManager = await factory.isManager(signer.address)
            if (!isManager) {
                console.log(`❗ ${signer.address} is not a manager for the factory contract on ${network} ${env}`)
            } else {
                console.log(`✅ ${signer.address} is a manager for the factory contract on ${network} ${env}`)
            }
            const salt = getSalt(hre, env)
            const predicateAddress = await factory.getDeployed(salt)
            console.log(`Predicted address for your salt: ${predicateAddress}`)
        }
    })

task('order:relayv2:set', 'Connect CrossChainRelayV2 with each other between orderly chain and other chains')
    .addParam('env', 'The environment to set peer', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
        const network = hre.network.name
        utils.checkEnv(env)
        utils.checkNetwork(env, network)
        const [signer] = await hre.ethers.getSigners()
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const ccRelayV2 = await getContract(hre, 'CrossChainRelayV2', ccRelayV2Address, signer)

        await setPeer(hre, env, network, ccRelayV2, signer)
        await setChainId(hre, env, network, ccRelayV2, signer)
        await setCCManager(hre, env, network, ccRelayV2, signer)
        await setLzOption(hre, ccRelayV2, signer)
    })

task('quick:relayv2:set', 'Quick set the CrossChainRelayV2 contract on all supported networks')
    .addParam('env', 'The environment to set', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const networks = utils.getNetworks(env)
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        for (const network of networks) {
            console.log(`============== Setting CrossChainRelayV2 on ${padString(network, 15)} ==============`)
            const [signer, provider] = getNetworkSignerAndProvider(hre, network)
            const ccRelayV2 = await getContract(hre, 'CrossChainRelayV2', ccRelayV2Address, signer)
            await setPeer(hre, env, network, ccRelayV2, signer)
            await setChainId(hre, env, network, ccRelayV2, signer)
            await setCCManager(hre, env, network, ccRelayV2, signer)
            await setLzOption(hre, ccRelayV2, signer)
        }
    })

task('order:relayv2:getconfig', 'Get the config of CrossChainRelayV2')
    .addParam('env', 'The environment to get config', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
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

task('order:relayv2:setconfig', 'Set the config of CrossChainRelayV2')
    .addParam('env', 'The environment to set config', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        // TODO: set config for mainnet
    })

task('order:relayv2:transfer', 'Transfer gas token to the CrossChainRelayV2 contract')
    .addParam('env', 'The environment to transfer gas token', undefined, types.string)
    .addParam('amount', 'The amount of gas token to transfer', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env, amount } = args
        utils.checkEnv(env)
        const network = hre.network.name
        const [signer] = await hre.ethers.getSigners()
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const gasTokenAmount = hre.ethers.utils.parseEther(amount)

        const tx = await signer.sendTransaction({
            to: ccRelayV2Address,
            value: gasTokenAmount,
            gasLimit: 100000,
        })
        const receipt = await tx.wait()
        console.log(
            `✅ Transferred ${amount} gas token to ${ccRelayV2Address} with tx hash: ${receipt.transactionHash}`
        )
    })

task('order:relayv2:owner', 'Set the owner of RelayV2 contract')
    .addParam('env', 'The environment to set owner', undefined, types.string)
    .addFlag('setOwner', 'Set the owner of RelayV2 contract')
    .setAction(async (taskArgs, hre) => {
        const { env } = taskArgs
        const network = hre.network.name
        utils.checkEnv(env)
        utils.checkNetwork(env, network)
        const [signer] = await hre.ethers.getSigners()
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const ccRelayV2 = await getContract(hre, 'CrossChainRelayV2', ccRelayV2Address, signer)
        const owner = await ccRelayV2.owner()
        const endpointV2Deployment = await hre.deployments.get('EndpointV2')
        const endpointV2 = await hre.ethers.getContractAt(
            endpointV2Deployment.abi,
            endpointV2Deployment.address,
            signer
        )
        const delegate = await endpointV2.delegates(ccRelayV2Address)
        console.log(`Current owner: ${owner}`)
        console.log(`Current delegate: ${delegate}`)
        const multiSig = utils.getMultisigAddress(env, network)
        let nonce = await hre.ethers.provider.getTransactionCount(signer.address)
        console.log(`Nonce: ${nonce}`)
        if (taskArgs.setOwner) {
            const txSetDelegator = await ccRelayV2.setDelegate(multiSig, { nonce: nonce++ })
            await txSetDelegator.wait()
            console.log(`Set OFT Delegator to ${multiSig}`)
            const txSetOwner = await ccRelayV2.transferOwnership(multiSig, { nonce: nonce++ })
            await txSetOwner.wait()
            console.log(`Set OFT Owner to ${multiSig}`)
        }
    })

task('order:relayv2:pingpong', 'Pingpong test')
    .addParam('env', 'The environment to pingpong', undefined, types.string)
    .addParam('dstNetwork', 'The destination network to pingpong', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env, dstNetwork } = args
        utils.checkEnv(env)
        utils.checkNetwork(env, dstNetwork)
        const network = hre.network.name
        utils.checkNetwork(env, network)
        const [signer] = await hre.ethers.getSigners()
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const ccRelayV2 = await getContract(hre, 'CrossChainRelayV2', ccRelayV2Address, signer)
        const lzConfig = utils.getLzConfig(dstNetwork)
        const tx = utils.isPolygonNetwork(network)
            ? await ccRelayV2.pingPong(lzConfig.chainId, { gasPrice: 30000000000 })
            : await ccRelayV2.pingPong(lzConfig.chainId)
        const receipt = await tx.wait()
        console.log(`Pingpong to ${dstNetwork} with tx hash: ${receipt.transactionHash}`)
        utils.getLayerZeroScanLink(receipt.transactionHash)
    })

task('quick:relayv2:pingpong', 'Quick pingpong test on all supported networks')
    .addParam('env', 'The environment to pingpong', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const networks = utils.getNetworks(env)
        for (const network of networks) {
            if (!utils.isOrderlyNetwork(network)) {
                const [signer, provider] = getNetworkSignerAndProvider(hre, network)
                const ccRelayV2Address = utils.getCCRelayV2Address(env)
                const ccRelayV2 = await getContract(hre, 'CrossChainRelayV2', ccRelayV2Address, signer)
                const orderlyLzConfig = utils.getLzConfig(utils.getOrderlyNetwork(env))
                const tx = utils.isPolygonNetwork(network)
                    ? await ccRelayV2.pingPong(orderlyLzConfig.chainId, { gasPrice: 30000000000 })
                    : await ccRelayV2.pingPong(orderlyLzConfig.chainId)
                const receipt = await tx.wait()
                console.log(`Pingpong to ${network} with tx hash: ${receipt.transactionHash}`)
                utils.getLayerZeroScanLink(receipt.transactionHash)
            }
        }
    })

task('lz:receive', 'Receive a message on a specific network')
    .addParam('hash', 'The hash of the receive alert txn', undefined, types.string)
    .setAction(async (args, hre) => {
        const { network, hash } = args

        const receiveAlertTopic = hre.ethers.utils.id(
            'LzReceiveAlert(address,address,(uint32,bytes32,uint64),bytes32,uint256,uint256,bytes,bytes,bytes)'
        )
        const endpointV2Deployment = await hre.deployments.get('EndpointV2')
        const [signer] = await hre.ethers.getSigners()
        const endpointV2 = await hre.ethers.getContractAt(
            endpointV2Deployment.abi,
            endpointV2Deployment.address,
            signer
        )

        const receiveAlertTxn = await hre.ethers.provider.getTransactionReceipt(hash)
        if (!receiveAlertTxn) {
            throw new Error(`Transaction with hash ${hash} not found`)
        }
        const logs = receiveAlertTxn.logs
        const receiveAlertLog = logs.find((log) => log.topics[0] === receiveAlertTopic)

        if (!receiveAlertLog) {
            throw new Error(`Receive alert log not found`)
        }
        const log = endpointV2.interface.parseLog(receiveAlertLog)

        const retryLzReceiveTx = await endpointV2.lzReceive(
            log.args['origin'],
            log.args['receiver'],
            log.args['guid'],
            log.args['message'],
            log.args['extraData'],
            {
                gasLimit: log.args['gas'] * 2,
                value: log.args['value'],
            }
        )

        console.log(`lz receive sent with tx hash ${retryLzReceiveTx.hash}`)
        utils.getLayerZeroScanLink(retryLzReceiveTx.hash)
    })

task('lz:nonce', 'Get the nonce of relayv2 on the LayerZero endpoint')
    .addParam('env', 'The environment to get nonce', undefined, types.string)
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const padNetworkName = (str: string, len = 15) => str.toString().padEnd(len)
        const padNonce = (str: string, len = 3) => str.toString().padStart(len)
        const networks = utils.getNetworks(env)
        const orderlyNetwork = utils.getOrderlyNetwork(env)
        const orderlyLzConfig = utils.getLzConfig(orderlyNetwork)
        for (const vaultNetwork of networks) {
            if (vaultNetwork !== orderlyNetwork) {
                const [orderlySigner, orderlyProvider] = getNetworkSignerAndProvider(hre, orderlyNetwork)
                const [vaultSigner, vaultProvider] = getNetworkSignerAndProvider(hre, vaultNetwork)
                const vaultLzConfig = utils.getLzConfig(vaultNetwork)

                const relayV2Address = utils.getCCRelayV2Address(env)
                const endpointV2Deployment = await hre.deployments.get('EndpointV2')
                const paddedRelayV2Address = hre.ethers.utils.hexZeroPad(relayV2Address, 32)
                const orderlyEndpointV2 = await hre.ethers.getContractAt(
                    endpointV2Deployment.abi,
                    orderlyLzConfig.endpointAddress,
                    orderlySigner
                )
                // console.log(`${orderlyNetwork}'s eid`, (await orderlyEndpointV2.eid()))
                const vaultEndpointV2 = await hre.ethers.getContractAt(
                    endpointV2Deployment.abi,
                    vaultLzConfig.endpointAddress,
                    vaultSigner
                )
                // console.log(`${vaultNetwork}'s eid`, (await vaultEndpointV2.eid()))

                const vaultSentNonce = await vaultEndpointV2.outboundNonce(
                    relayV2Address,
                    orderlyLzConfig.endpointId,
                    paddedRelayV2Address
                )
                const orderlyReceivedNonce = await orderlyEndpointV2.inboundNonce(
                    relayV2Address,
                    vaultLzConfig.endpointId,
                    paddedRelayV2Address
                )
                console.log(
                    `Msg sent from 💰 ${padNetworkName(vaultNetwork)} to 🔑 ${padNetworkName(orderlyNetwork)}: ${padNonce(vaultSentNonce)} -> ${padNonce(orderlyReceivedNonce)} received ${Number(vaultSentNonce) === Number(orderlyReceivedNonce) ? '✅' : '❌'}`
                )
                const orderlySentNonce = await orderlyEndpointV2.outboundNonce(
                    relayV2Address,
                    vaultLzConfig.endpointId,
                    paddedRelayV2Address
                )
                const vaultReceivedNonce = await vaultEndpointV2.inboundNonce(
                    relayV2Address,
                    orderlyLzConfig.endpointId,
                    paddedRelayV2Address
                )
                console.log(
                    `Msg sent from 🔑 ${padNetworkName(orderlyNetwork)} to 💰 ${padNetworkName(vaultNetwork)}: ${padNonce(orderlySentNonce)} -> ${padNonce(vaultReceivedNonce)} received ${Number(orderlySentNonce) === Number(vaultReceivedNonce) ? '✅' : '❌'}`
                )
            }
        }
    })
task('order:relayv2:nonce', 'Get the nonce of the CrossChainRelayV2 contract')
    .addParam('env', 'The environment to get nonce', undefined, types.string)
    .setAction(async (args, hre) => {
        // const envs = utils.getEnvs()
        const { env } = args
        utils.checkEnv(env)
        // for (const env of envs) {
        console.log(`======= RelayV2 nonce for ${env} =======`)

        const networks = utils.getNetworks(env)
        const relayV2Address = utils.getCCRelayV2Address(env)
        const paddedPeerAddress = hre.ethers.utils.hexZeroPad(relayV2Address, 32)
        for (const network of networks) {
            const [signer, provider] = getNetworkSignerAndProvider(hre, network)
            const relayV2 = await hre.ethers.getContractAt('CrossChainRelayV2', relayV2Address, signer)

            if (!utils.isOrderlyNetwork(network)) {
                const orderlyNetwork = utils.getOrderlyNetwork(env)
                const lzConfig = utils.getLzConfig(orderlyNetwork)
                const nonce = await relayV2.nonce(lzConfig.endpointId, paddedPeerAddress)
                console.log(`Nonce from ${network}: ${nonce}`)
            } else {
                for (const vaultNetwork of networks) {
                    if (!utils.isOrderlyNetwork(vaultNetwork)) {
                        const lzConfig = utils.getLzConfig(vaultNetwork)
                        const nonce = await relayV2.nonce(lzConfig.endpointId, paddedPeerAddress)
                        console.log(`Nonce to ${vaultNetwork}: ${nonce}`)
                    }
                }
            }
        }
        // }
    })

const PROXY_1967_SLOT = '0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC'
task('order:manager:upgrade', 'Generate the proposal to upgrade the CCManager and set config')
    .addParam('env', 'The environment to upgrade the CCManager', undefined, types.string)
    .addFlag('writeProposal', 'Write the proposal to the safe tasks folder')
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const network = hre.network.name
        const orderlyAddresses = await utils.getOrderlyAddresses()
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const [signer] = await hre.ethers.getSigners()

        const ccManager = orderlyAddresses[env][network].CCManager
        const implStorage = await hre.ethers.provider.getStorageAt(ccManager, PROXY_1967_SLOT)
        const curCCManagerImpl = hre.ethers.utils.getAddress('0x' + implStorage.slice(26))
        const CCManagerImplV2 = orderlyAddresses[env][network].CCManagerImplV2

        if (curCCManagerImpl.toLowerCase() !== CCManagerImplV2.toLowerCase()) {
            console.log(`⛔ CCManager on ${network} is not upgraded, generate proposal for upgrading CCManager...`)
            await generateCCManagerProposal(env, network, orderlyAddresses, ccRelayV2Address, args.writeProposal)
        } else {
            console.log(`✅ CCManager on ${network} is already upgraded`)
        }
    })

task('quick:manager:upgrade', 'Quickly upgrade the CCManager on all supported networks')
    .addParam('env', 'The environment to upgrade the CCManager', undefined, types.string)
    .addFlag('writeProposal', 'Write the proposal to the safe tasks folder')
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const ccRelayV2Address = utils.getCCRelayV2Address(env)

        const networks = utils.getNetworks(env)
        const orderlyAddresses = await utils.getOrderlyAddresses()
        for (const network of networks) {
            const ccManager = orderlyAddresses[env][network].CCManager
            const CCManagerImplV2 = orderlyAddresses[env][network].CCManagerImplV2
            const [signer, provider] = getNetworkSignerAndProvider(hre, network)
            const implStorage = await provider.getStorageAt(ccManager, PROXY_1967_SLOT)
            const curCCManagerImpl = ethers.utils.getAddress('0x' + implStorage.slice(26))

            let proposals = []
            if (curCCManagerImpl.toLowerCase() !== CCManagerImplV2.toLowerCase()) {
                console.log(`⛔ CCManager on ${network} is not upgraded, generate proposal for upgrading CCManager...`)
                await generateCCManagerProposal(env, network, orderlyAddresses, ccRelayV2Address, args.writeProposal)
            } else {
                console.log(`✅ CCManager on ${network} is already upgraded`)
            }
        }
    })

task('order:manager:relayoption', 'Propose to enable CrossChainRelayV2 as the default relay')
    .addParam('env', 'The environment to set CrossChainRelayV2 as the default relay', undefined, types.string)
    .addFlag('writeProposal', 'Write the proposal to the safe tasks folder')
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const [signer] = await hre.ethers.getSigners()
        const network = hre.network.name
        const ccManager = await getCCManagerContract(hre, env, network, signer)
        const orderlyAddresses = await utils.getOrderlyAddresses()
        const lzConfig = utils.getLzConfig(network)
        await generateRelayOptionProposal(env, network, ccManager, args.writeProposal)
    })

task('quick:manager:relayoption', 'Quickly set the relay option to V2 for all supported networks')
    .addParam('env', 'The environment to set CrossChainRelayV2 as the default relay', undefined, types.string)
    .addFlag('writeProposal', 'Write the proposal to the safe tasks folder')
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const ccRelayV2Address = utils.getCCRelayV2Address(env)
        const orderlyAddresses = await utils.getOrderlyAddresses()
        const networks = utils.getNetworks(env)
        let proposals = []
        for (const network of networks) {
            const [signer, provider] = getNetworkSignerAndProvider(hre, network)
            const ccManagerAddress = orderlyAddresses[env][network].CCManager

            const ccManager = await getCCManagerContract(hre, env, network, signer)

            await generateRelayOptionProposal(env, network, ccManager, args.writeProposal)
        }
    })

task('order:manager:disable', 'Propose to disable CrossChainRelayV1')
    .addParam('env', 'The environment to disable CrossChainRelayV1', undefined, types.string)
    .addFlag('writeProposal', 'Write the proposal to the safe tasks folder')
    .setAction(async (args, hre) => {
        const { env } = args
        utils.checkEnv(env)
        const [signer] = await hre.ethers.getSigners()
        const network = hre.network.name
        const ccManager = await getCCManagerContract(hre, env, network, signer)
        const ccRelayV1Address = (await utils.getOrderlyAddresses())[env][network].CCRelayV1
        const ccRelayV1Status = await ccManager.enabledRelays(ccRelayV1Address)
        let proposals = []
        if (ccRelayV1Status !== 0) {
            const proposalSetRelayStatus = {
                _description: 'Set the relay status of CrossChainRelayV1',
                to: `${ccManager.address}`,
                value: '0',
                method: 'setRelayStatus(address,bool)',
                params: [`${ccRelayV1Address}`, false],
                operation: 0,
            }
            proposals.push(proposalSetRelayStatus)
        } else {
            console.log(`✅ CrossChainRelayV1 is already disabled`)
        }

        console.log(JSON.stringify(proposals, null, 2))

        const proposalName = `${env === 'mainnet' ? 'PRODUCTION' : env.toUpperCase()}_${network.toUpperCase()}_${'DISABLE_RELAY_V1'.toUpperCase()}.json`
        if (args.writeProposal) {
            await utils.writeProposal(utils.PROPOSAL_FOLDER, proposals, proposalName)
            console.log(`✅ Written proposal to disable CrossChainRelayV1 to ${utils.PROPOSAL_FOLDER}`)
        }
    })

// Deploy the CrossChainRelayV2 contract implementation
async function deployCCRelayV2Impl(env: string, hre: HardhatRuntimeEnvironment, signer: SignerWithAddress) {
    const CCRelayV2Name = 'CrossChainRelayV2'
    const CCRelayV2ImplAddress = await deployContract(hre, signer, CCRelayV2Name, [])
    console.log(`${CCRelayV2Name} contract implementation deployed to ${CCRelayV2ImplAddress}`)

    return CCRelayV2ImplAddress
}

// Deploy a contract to a specific network
async function deployContract(
    hre: HardhatRuntimeEnvironment,
    signer: SignerWithAddress,
    contract: string,
    args: any[]
) {
    const { deploy } = hre.deployments
    const baseDeployArgs = {
        from: signer.address,
        log: true,
    }
    const deployedContract = await deploy(contract, {
        ...baseDeployArgs,
        args: args,
    })
    const contractAddress = deployedContract.address
    // console.log(`deployed contract ${contract} `)
    console.log(`deployed contract ${contract} to ${contractAddress} with tx hash: ${deployedContract.transactionHash}`)
    return contractAddress
}

async function deployContractWithProxy(
    hre: HardhatRuntimeEnvironment,
    signer: SignerWithAddress,
    contract: string,
    args: any[]
) {
    // TODO
}

async function deployContractDeterministic(
    hre: HardhatRuntimeEnvironment,
    signer: SignerWithAddress,
    contract: string,
    args: any[],
    salt: string
) {
    // TODO
}

// Get the factory contract which can deploy the proxy contract using `create3`
async function getFactoryContract(hre: HardhatRuntimeEnvironment, env: string, signer: SignerWithAddress) {
    const factoryContractPath = path.join(__dirname, './asset/Factory.json')
    const artifact = JSON.parse(fs.readFileSync(factoryContractPath, 'utf8'))
    const factoryAddress = utils.getFactoryAddress(env)
    const factory = await hre.ethers.getContractAt(artifact.abi, factoryAddress, signer)
    return factory
}

async function setLzOption(hre: HardhatRuntimeEnvironment, ccRelayV2: Contract, signer: SignerWithAddress) {
    let nonce = await signer.getTransactionCount()
    const zeroValue = 0
    const methods = utils.getMethod()
    const network = hre.network.name
    // console.log(network)
    const methodsNames = Object.keys(methods).filter((k) => isNaN(Number(k)))
    console.log(`Print all message types and its gas limit:`)
    for (const method of methodsNames) {
        const methodIndex = methods[method as keyof typeof methods]
        const gasLimit = utils.getMethodOption(methodIndex)
        const [gasLimitOnRelay, _] = await ccRelayV2.lzOptions(methodIndex)
        if (Number(gasLimitOnRelay) !== gasLimit) {
            console.log(`❗ Gas limit on relay is not the same as the const file`)
            console.log(`Gas limit on relay v2: ${gasLimitOnRelay}`)
            console.log(`${method} on const file: ${gasLimit}`)
            if (network === 'amoy') {
                const tx = await ccRelayV2.setMethodOption(methodIndex, gasLimit, zeroValue, {
                    nonce: nonce++,
                    gasPrice: 30_000_000_000,
                })
                const receipt = await tx.wait()
                console.log(`✅ Set gas limit on relay to ${gasLimit}: ${receipt.transactionHash}`)
            } else {
                const tx = await ccRelayV2.setMethodOption(methodIndex, gasLimit, zeroValue, { nonce: nonce++ })
                const receipt = await tx.wait()
                console.log(`✅ Set gas limit for on relay to ${gasLimit}: ${receipt.transactionHash}`)
            }
        } else {
            console.log(`✅ Gas limit on relay for ${padString(method, 20)} is the same as the config file`)
        }
    }
}

// TODO
async function setLzConfig() {}

// Get the contract instance within the contracts folder
async function getContract(
    hre: HardhatRuntimeEnvironment,
    contract: string,
    address: string,
    signer: SignerWithAddress
) {
    return await hre.ethers.getContractAt(contract, address, signer)
}

async function getCCManagerContract(
    hre: HardhatRuntimeEnvironment,
    env: string,
    network: string,
    signer: SignerWithAddress
) {
    const orderlyAddresses = await utils.getOrderlyAddresses()
    const ccManagerAddress = orderlyAddresses[env][network].CCManager
    let ccManagerAbiPath = ''
    if (utils.isOrderlyNetwork(network)) {
        ccManagerAbiPath = path.join(__dirname, './asset/LedgerCCManagerV2.json')
    } else {
        ccManagerAbiPath = path.join(__dirname, './asset/VaultCCManagerV2.json')
    }

    const artifact = JSON.parse(fs.readFileSync(ccManagerAbiPath, 'utf8'))
    const ccManager = await hre.ethers.getContractAt(artifact.abi, ccManagerAddress, signer)
    return ccManager
}

const EXECUTOR_CONFIG_STRUCT = 'tuple(uint32 maxMessageSize, address executorAddress)'
// const EXECUTOR_CONFIG_STRUCT = ["uint32","address"]
const ULN_CONFIG_STRUCT =
    'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)'
// const ULN_CONFIG_STRUCT = ["uint64","uint8","uint8","uint8","address[]","address[]"]

const CONFIG_TYPE_EXECUTOR = 1
const CONFIG_TYPE_ULN = 2

// Get the EndpointV2 contract instance
async function getEndpointV2Contract(hre: HardhatRuntimeEnvironment, signer: SignerWithAddress) {
    const endpointV2Deployment = await hre.deployments.get('EndpointV2')
    const endpointV2Contract = await hre.ethers.getContractAt(
        endpointV2Deployment.abi,
        endpointV2Deployment.address,
        signer
    )
    return endpointV2Contract
}

// Print the config of CrossChainRelayV2 on orderly chain
async function printLedgerRelayConfig(
    hre: HardhatRuntimeEnvironment,
    env: string,
    signer: SignerWithAddress,
    endpointV2: Contract
) {
    const relayV2Address = utils.getCCRelayV2Address(env)
    for (const network of utils.getNetworks(env)) {
        if (!utils.isOrderlyNetwork(network)) {
            await printConfig(hre, endpointV2, relayV2Address, network)
        }
        continue
    }
}

// Print the config of CrossChainRelayV2 on vault chain
async function printVaultRelayConfig(
    hre: HardhatRuntimeEnvironment,
    env: string,
    signer: SignerWithAddress,
    endpointV2: Contract
) {
    const relayV2Address = utils.getCCRelayV2Address(env)
    for (const network of utils.getNetworks(env)) {
        if (!utils.isOrderlyNetwork(network)) {
            continue
        }
        await printConfig(hre, endpointV2, relayV2Address, network)
    }
}

function getNetworkSignerAndProvider(hre: HardhatRuntimeEnvironment, network: string) {
    hre.network.name = network
    hre.network.config = hre.config.networks[network]
    const provider = new hre.ethers.providers.JsonRpcProvider(hre.config.networks[network].url) // url is defined in HttpNetworkConfig
    const signer = new ethers.Wallet(hre.config.networks[network].accounts[0], provider)
    return [signer, provider]
}

// Print the config of CrossChainRelayV2 on a specific chain
async function printConfig(
    hre: HardhatRuntimeEnvironment,
    endpointV2: Contract,
    relayV2Address: string,
    dstNetwork: string
) {
    const lzConfig = utils.getLzConfig(dstNetwork)
    const defaultSendLib = await endpointV2.defaultSendLibrary(lzConfig.endpointId)
    const defaultReceiveLib = await endpointV2.defaultReceiveLibrary(lzConfig.endpointId)
    const onchainSendLibConfigExecutor = await endpointV2.getConfig(
        relayV2Address,
        defaultSendLib,
        lzConfig.endpointId,
        CONFIG_TYPE_EXECUTOR
    )
    const onchainSendLibConfigULN = await endpointV2.getConfig(
        relayV2Address,
        defaultSendLib,
        lzConfig.endpointId,
        CONFIG_TYPE_ULN
    )
    const onchainReceiveLibConfigULN = await endpointV2.getConfig(
        relayV2Address,
        defaultReceiveLib,
        lzConfig.endpointId,
        CONFIG_TYPE_ULN
    )
    const [decodeSendLibConfigExecutor] = hre.ethers.utils.defaultAbiCoder.decode(
        [EXECUTOR_CONFIG_STRUCT],
        onchainSendLibConfigExecutor
    )
    const [decodeSendLibConfigULN] = hre.ethers.utils.defaultAbiCoder.decode(
        [ULN_CONFIG_STRUCT],
        onchainSendLibConfigULN
    )
    const [decodeReceiveLibConfigULN] = hre.ethers.utils.defaultAbiCoder.decode(
        [ULN_CONFIG_STRUCT],
        onchainReceiveLibConfigULN
    )

    console.log(`=================Print Config for pathway to ${dstNetwork}===================`)
    console.log(`Default SendLib: ${defaultSendLib}`)
    console.log(
        `Onchain SendLibConfigExecutor: \n maxMessageSize: ${decodeSendLibConfigExecutor[0]},\n executor: ${decodeSendLibConfigExecutor[1]}`
    )
    console.log(
        `Onchain SendLibConfigULN: \n confirmations: ${decodeSendLibConfigULN[0]}, \n requiredDVNCount: ${decodeSendLibConfigULN[1]}, \n optionalDVNCount: ${decodeSendLibConfigULN[2]}, \n optionalDVNThreshold: ${decodeSendLibConfigULN[3]}, \n requiredDVNs: ${decodeSendLibConfigULN[4]}, \n optionalDVNs: ${decodeSendLibConfigULN[5]} \n`
    )

    console.log(`Default ReceiveLib: ${defaultReceiveLib}`)
    console.log(
        `Onchain ReceiveLibConfigULN: \n confirmations: ${decodeReceiveLibConfigULN[0]}, \n requiredDVNCount: ${decodeReceiveLibConfigULN[1]}, \n optionalDVNCount: ${decodeReceiveLibConfigULN[2]}, \n optionalDVNThreshold: ${decodeReceiveLibConfigULN[3]}, \n requiredDVNs: ${decodeReceiveLibConfigULN[4]}, \n optionalDVNs: ${decodeReceiveLibConfigULN[5]} \n`
    )
}

async function getCCRelayV2ProxyBytecode(
    hre: HardhatRuntimeEnvironment,
    ccV2ImplAddress: string,
    signer: SignerWithAddress,
    lzEndpoint: string,
    delegate: string
) {
    const ccV2Contract = await getContract(hre, 'CrossChainRelayV2', ccV2ImplAddress, signer)
    const ccV2InitData = ccV2Contract.interface.encodeFunctionData('initialize', [lzEndpoint, delegate])
    const constructorArgs = hre.ethers.utils.defaultAbiCoder.encode(
        ['address', 'bytes'],
        [ccV2ImplAddress, ccV2InitData]
    )

    const erc1967ProxyPath = path.join(__dirname, './asset/ERC1967Proxy.json')
    const erc1967ProxyArtifact = JSON.parse(fs.readFileSync(erc1967ProxyPath, 'utf8'))
    const proxyBytecode = hre.ethers.utils.concat([erc1967ProxyArtifact.bytecode, constructorArgs])
    return proxyBytecode
}

async function setPeer(
    hre: HardhatRuntimeEnvironment,
    env: string,
    network: string,
    ccRelayV2: Contract,
    signer: SignerWithAddress
) {
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
                    console.log(`❗ Peer is not set, setting peer to ${remoteNetwork}`)
                    eids.push(lzConfig.endpointId)
                    peers.push(paddedPeerAddress)
                } else {
                    console.log(`✅ Peer to ${padString(remoteNetwork, 15)} already set`)
                }
            }
            continue
        }

        if (eids.length > 0) {
            const tx = await ccRelayV2.setPeers(eids, peers, { nonce: nonce++ })
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
            console.log('❗Peer not set, setting peer to orderly network')
            const tx = utils.isPolygonNetwork(network)
                ? await ccRelayV2.setPeer(lzConfig.endpointId, paddedPeerAddress, {
                      nonce: nonce++,
                      gasPrice: 30000000000,
                  })
                : await ccRelayV2.setPeer(lzConfig.endpointId, paddedPeerAddress, { nonce: nonce++ })
            const receipt = await tx.wait()
            console.log(`✅ Set peer to ${ordderlyNetwork}: ${receipt.transactionHash}`)
        } else {
            console.log(`✅ Peer to ${ordderlyNetwork} already set`)
        }
    }
}

async function setChainId(
    hre: HardhatRuntimeEnvironment,
    env: string,
    network: string,
    ccRelayV2: Contract,
    signer: SignerWithAddress
) {
    const networks = utils.getNetworks(env)

    let nonce = await signer.getTransactionCount()
    if (utils.isOrderlyNetwork(network)) {
        for (const remoteNetwork of networks) {
            if (!utils.isOrderlyNetwork(remoteNetwork)) {
                const lzConfig = utils.getLzConfig(remoteNetwork)
                const savedEid = await ccRelayV2.chainId2Eid(lzConfig.chainId)
                if (savedEid !== lzConfig.endpointId) {
                    console.log(`❗ EID mismatch for ${remoteNetwork}, setting EID`)
                    const tx = await ccRelayV2.addChainIdMapping(lzConfig.chainId, lzConfig.endpointId, {
                        nonce: nonce++,
                    })
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
            console.log(`❗ EID mismatch for ${ordderlyNetwork}, setting EID`)
            const tx = utils.isPolygonNetwork(network)
                ? await ccRelayV2.addChainIdMapping(lzConfig.chainId, lzConfig.endpointId, {
                      nonce: nonce++,
                      gasPrice: 30000000000,
                  })
                : await ccRelayV2.addChainIdMapping(lzConfig.chainId, lzConfig.endpointId, { nonce: nonce++ })
            const receipt = await tx.wait()
            console.log(`✅ Set ChainId and Eid to ${ordderlyNetwork}: ${receipt.transactionHash}`)
        } else {
            console.log(`✅ ChainId and Eid to ${ordderlyNetwork} already set`)
        }
    }
}

async function setCCManager(
    hre: HardhatRuntimeEnvironment,
    env: string,
    network: string,
    ccRelayV2: Contract,
    signer: SignerWithAddress
) {
    const orderlyAddresses = await utils.getOrderlyAddresses()
    // console.log('orderlyAddresses', orderlyAddresses)
    const ccManagerAddress = orderlyAddresses[env][network].CCManager
    const savedCCManagerAddress = await ccRelayV2.ccManager()
    // console.log('savedCCManagerAddress', savedCCManagerAddress)
    let nonce = await signer.getTransactionCount()
    if (savedCCManagerAddress.toLowerCase() !== ccManagerAddress.toLowerCase()) {
        console.log('❗ CCManager mismatch, setting CCManager')
        const tx = utils.isPolygonNetwork(network)
            ? await ccRelayV2.setCCManager(ccManagerAddress, { nonce: nonce++, gasPrice: 30000000000 })
            : await ccRelayV2.setCCManager(ccManagerAddress, { nonce: nonce++ })
        const receipt = await tx.wait()
        console.log(`✅ Set CCManager on ${network}: ${receipt.transactionHash}`)
    } else {
        console.log(`✅ CCManager on ${network} already set`)
    }
}

async function getImplAddress(hre: HardhatRuntimeEnvironment, env: string, proxyAddress: string) {
    const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
    const storage = await hre.ethers.provider.getStorageAt(proxyAddress, IMPLEMENTATION_SLOT)
    const implAddress = await hre.ethers.utils.getAddress('0x' + storage.slice(26)) // 取最后20字节
    return implAddress
}

function getSalt(hre: HardhatRuntimeEnvironment, env: string) {
    return hre.ethers.utils.id(process.env.ORDER_DEPLOYMENT_SALT + `${env}` || 'deterministicDeployment')
}

function samePeer(paddedPeerAddress: string, savedPeerAddress: string) {
    return paddedPeerAddress.toLowerCase() === savedPeerAddress.toLowerCase()
}

function padString(str: string, len: number) {
    return str.toString().padEnd(len)
}

async function generateCCManagerProposal(
    env: string,
    network: string,
    orderlyAddresses: any,
    ccRelayV2Address: string,
    writeProposal: boolean | false
) {
    const proposalUpgrade = {
        _description: 'Upgrade the CCManager',
        _verify: `ts-node verify.ts --contract ${utils.isOrderlyNetwork(network) ? 'LedgerCrossChainManagerUpgradeable' : 'VaultCrossChainManagerUpgradeable'} --repo evm-cross-chain --address ${orderlyAddresses[env][network].CCManagerImplV2} --network ${utils.getNetworkNameToVerify(network)} --commit v2.0.0-zenith-audit`,
        to: `${orderlyAddresses[env][network].CCManager}`,
        value: '0',
        method: 'upgradeTo(address)',
        params: [`${orderlyAddresses[env][network].CCManagerImplV2}`],
        operation: 0,
    }

    const proposalSetRelayV1Status = {
        _description: 'Set the relay status of CrossChainRelayV1',
        to: `${orderlyAddresses[env][network].CCManager}`,
        value: '0',
        method: 'setRelayStatus(address,bool)',
        params: [`${orderlyAddresses[env][network].CCRelayV1}`, true],
        operation: 0,
    }

    const proposalSetRelayV2Address = {
        _description: 'Set the address of CrossChainRelayV2',
        _verifyRelayV2Impl: `ts-node verify.ts --contract CrossChainRelayV2 --repo cc-v2 --address ${orderlyAddresses[env][network].CCRelayV2Impl} --network ${utils.getNetworkNameToVerify(network)} --commit v1.0.0-zenith-audit`,
        _verifyRelayV2Proxy: `ts-node verify.ts --contract ERC1967Proxy --repo strategy-vault --address ${ccRelayV2Address} --network ${utils.getNetworkNameToVerify(network)} --commit v0.1.1-mainnet`,
        to: `${orderlyAddresses[env][network].CCManager}`,
        value: '0',
        method: 'setCrossChainRelayV2(address)',
        params: [`${ccRelayV2Address}`],
        operation: 0,
    }

    const proposalSetRelayV2Status = {
        _description: 'Set the relaystatus of CrossChainRelayV2',
        to: `${orderlyAddresses[env][network].CCManager}`,
        value: '0',
        method: 'setRelayStatus(address,bool)',
        params: [`${ccRelayV2Address}`, true],
        operation: 0,
    }
    const proposals = [proposalUpgrade, proposalSetRelayV1Status, proposalSetRelayV2Address, proposalSetRelayV2Status]
    // console.log(JSON.stringify(proposals, null, 2))
    const proposalName = `${env === 'mainnet' ? 'PRODUCTION' : env.toUpperCase()}_${network.toUpperCase()}_${'UPGRADE_CCMANAGER'.toUpperCase()}.json`

    if (writeProposal) {
        const ProposalNumber = await utils.writeProposal(utils.PROPOSAL_FOLDER, proposals, proposalName)
        console.log(`✅ Written proposal to upgrade CCManager to ${utils.PROPOSAL_FOLDER}`)
        utils.printSafeCommand(env, network, ProposalNumber)
    } else {
        console.log(JSON.stringify(proposals, null, 2))
    }
}

async function generateRelayOptionProposal(
    env: string,
    network: string,
    ccManager: Contract,
    writeProposal: boolean | false
) {
    let proposals = []
    // set relay option for ledger network (orderly sepolia)
    if (utils.isOrderlyNetwork(network)) {
        const networks = utils.getNetworks(env)
        for (const vaultNetwork of networks) {
            if (!utils.isOrderlyNetwork(vaultNetwork)) {
                const lzConfig = utils.getLzConfig(vaultNetwork)

                try {
                    const relayOption = await ccManager.ccRelayOption(lzConfig.chainId)

                    if (relayOption !== 1) {
                        console.log(
                            `⛔ Relay option V2 to ${padString(vaultNetwork, 15)} on orderly is not set, generate proposal for setting relay option...`
                        )
                        const proposalSetRelayOption = {
                            _description: 'Set the relay option of CrossChainRelayV2',
                            to: `${ccManager.address}`,
                            value: '0',
                            method: 'setCCRelayOption(uint256,uint8)',
                            params: [lzConfig.chainId, 1],
                            operation: 0,
                        }
                        proposals.push(proposalSetRelayOption)
                    } else {
                        console.log(`✅ Relay option V2 to ${padString(vaultNetwork, 15)} on orderly already set`)
                    }
                } catch (error) {
                    console.log(
                        `⛔ CCManager on ${padString(vaultNetwork, 15)} is not upgraded, generate proposal for setting relay option in advance...`
                    )
                    console.log(
                        `⛔ Remember to upgrade CCManager on ${padString(vaultNetwork, 15)} first, before setting relay option!`
                    )
                    const proposalSetRelayOption = {
                        _description: 'Set the relay option of CrossChainRelayV2',
                        to: `${ccManager.address}`,
                        value: '0',
                        method: 'setCCRelayOption(uint256,uint8)',
                        params: [lzConfig.chainId, 1],
                        operation: 0,
                    }
                    proposals.push(proposalSetRelayOption)
                }
            }
        }
    }
    // set relay option for vault networks
    else {
        // new logic, first check if ccManager on vault network is upgraded using try-catch pattern
        // when upgraded: check relayOption, when relayOption !== 1, push proposal
        // when not upgraded: print message, push proposal
        try {
            const relayOption = await ccManager.ccRelayOption()
            if (relayOption !== 1) {
                console.log(
                    `⛔ Relay option to V2 for ${padString(network, 15)} is not set, generate proposal for setting relay option...`
                )
                const proposalSetRelayOption = {
                    _description: 'Set the relay option of CrossChainRelayV2',
                    to: `${ccManager.address}`,
                    value: '0',
                    method: 'setCCRelayOption(uint8)',
                    params: [1],
                    operation: 0,
                }
                proposals.push(proposalSetRelayOption)
            } else {
                console.log(`✅ Relay option V2 to orderly on ${padString(network, 15)} already set`)
            }
        } catch (error) {
            // only for CC V2 migration convenience: can generate proposal for relay option when CCManager not upgraded on vault networks
            // console.log(error)
            console.log(
                `⛔ CCManager on ${padString(network, 15)} is not upgraded, generate proposal for setting relay option in advance...`
            )
            console.log(
                `⛔ Remember to upgrade CCManager on ${padString(network, 15)} first, before setting relay option!`
            )
            const proposalSetRelayOption = {
                _description: 'Set the relay option of CrossChainRelayV2',
                to: `${ccManager.address}`,
                value: '0',
                method: 'setCCRelayOption(uint8)',
                params: [1],
                operation: 0,
            }
            proposals.push(proposalSetRelayOption)
        }
    }
    // console.log(JSON.stringify(proposals, null, 2))

    const proposalName = `${env === 'mainnet' ? 'PRODUCTION' : env.toUpperCase()}_${network.toUpperCase()}_${'SET_RELAY_OPTION'.toUpperCase()}.json`
    if (writeProposal) {
        const ProposalNumber = await utils.writeProposal(utils.PROPOSAL_FOLDER, proposals, proposalName)
        console.log(`✅ Written proposal to upgrade CCManager to ${utils.PROPOSAL_FOLDER}`)
        utils.printSafeCommand(env, network, ProposalNumber)
    } else {
        console.log(JSON.stringify(proposals, null, 2))
    }
}
