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
        // if (contract === 'CrossChainRelayV2') {
        //     await deployCCRelayV2Impl(env, hre, signer)
        // }
        const ccV2ImplAddress = '0x4a5CD23C5FdeE13369f61F705e9Ef1f620E08364'
        
        const factory = await getFactoryContract(hre, env, signer)
        const lzEndpoint = utils.getEndpoint(env)
        const delegate = signer.address
        const proxyBytecode = await getCCRelayV2ProxyBytecode(hre, ccV2ImplAddress, signer, lzEndpoint, delegate)
        const salt = getSalt(hre, env)
        const tx = await factory.deploy(salt, proxyBytecode)
        const receipt = await tx.wait()
        console.log('deployed contract:', receipt)
    })


async function deployCCRelayV2Impl(env: string, hre: HardhatRuntimeEnvironment, signer: SignerWithAddress) {

    const CCRelayV2Name = 'CrossChainRelayV2'
    const CCRelayV2ImplAddress = await deployContract(hre, signer, CCRelayV2Name, [])
    console.log(`${CCRelayV2Name} contract deployed to ${CCRelayV2ImplAddress}`)
    
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
