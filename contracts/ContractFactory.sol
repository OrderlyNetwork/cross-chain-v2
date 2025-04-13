// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { CREATE3 } from "solady/src/utils/CREATE3.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Factory for deploying contracts to deterministic addresses via CREATE3
/// @notice Enables deploying contracts using CREATE3. Each deployer (msg.sender) has
/// its own namespace for deployed addresses.

contract ContractFactory is Ownable {
    /// @dev manager has access to deploy contract to avoid contract address collision
    mapping(address => bool) public isDeployer;

    error NoAccess();

    event ContractDeployed(address deployedContract);
    event SetDeployer(address deployer, bool knob);

    constructor(address owner) Ownable(owner) {}

    modifier onlyDeployerOrOwner() {
        if (msg.sender != owner() && !isDeployer[msg.sender]) {
            revert NoAccess();
        }
        _;
    }

    function deploy(bytes32 salt, bytes memory creationCode) external onlyDeployerOrOwner returns (address) {
        // hash salt to get a deterministic address
        salt = keccak256(abi.encodePacked(salt));
        address contractAddress = CREATE3.deployDeterministic(creationCode, salt);

        emit ContractDeployed(contractAddress);
        return contractAddress;
    }

    function getDeployed(bytes32 salt) external view returns (address) {
        // hash salt to get a deterministic address
        salt = keccak256(abi.encodePacked(salt));
        return CREATE3.predictDeterministicAddress(salt);
    }

    function setDeployer(address[] calldata deployers, bool knob) external onlyOwner {
        for (uint256 i = 0; i < deployers.length; i++) {
            // Already set the same value
            if (isDeployer[deployers[i]] == knob) {
                continue;
            }
            isDeployer[deployers[i]] = knob;
            emit SetDeployer(deployers[i], knob);
        }
    }
}
