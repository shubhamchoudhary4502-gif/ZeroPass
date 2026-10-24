import { env } from '../config/env';

export interface BlockchainRegistryConfig {
  enabled: boolean;
  rpcUrl: string;
  contractAddress: string;
}

export class BlockchainRegistryProvider {
  private config: BlockchainRegistryConfig;

  constructor() {
    this.config = {
      enabled: env.BLOCKCHAIN_ENABLED === 'true',
      rpcUrl: env.BLOCKCHAIN_RPC_URL,
      contractAddress: env.BLOCKCHAIN_REGISTRY_ADDRESS,
    };
  }

  public getStatus() {
    return {
      enabled: this.config.enabled,
      network: 'Polygon Amoy Testnet (Chain ID 80002)',
      rpcUrl: this.config.rpcUrl,
      registryContract: this.config.contractAddress,
      architecture: {
        role: 'Decentralized Cryptographic Status List Registry & Issuer Anchor',
        dataStoredOnChain: [
          'Issuer DID public key fingerprint mapping (bytes32)',
          'Cryptographic revocation accumulator root hash (bytes32)',
          'Schema URI hash commitment (bytes32)',
        ],
        dataExplicitlyExcludedFromBlockchain: [
          'NEVER store names, birthdates, IDs, incomes, or credential claims',
          'NEVER store user wallet private keys or passwords',
          'NEVER store full credential documents or plaintext payloads',
        ],
      },
      solidityContractSpecification: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title ZeroPassRevocationRegistry
 * @dev Stores cryptographic accumulator state roots for non-repudiation
 */
contract ZeroPassRevocationRegistry {
    address public owner;
    mapping(address => bytes32) public issuerAccumulatorRoots;
    mapping(bytes32 => bool) public revokedCredentialHashes;

    event AccumulatorRootUpdated(address indexed issuer, bytes32 newRoot, uint256 timestamp);
    event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp);

    modifier onlyIssuer() {
        require(msg.sender == owner, "Only authorized issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function publishAccumulatorRoot(bytes32 newRoot) external onlyIssuer {
        issuerAccumulatorRoots[msg.sender] = newRoot;
        emit AccumulatorRootUpdated(msg.sender, newRoot, block.timestamp);
    }

    function revokeCredential(bytes32 credentialHash) external onlyIssuer {
        revokedCredentialHashes[credentialHash] = true;
        emit CredentialRevoked(credentialHash, msg.sender, block.timestamp);
    }

    function isCredentialRevoked(bytes32 credentialHash) external view returns (bool) {
        return revokedCredentialHashes[credentialHash];
    }
}`,
    };
  }
}

export const blockchainProvider = new BlockchainRegistryProvider();
