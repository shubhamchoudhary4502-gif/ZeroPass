import * as crypto from 'node:crypto';

/**
 * Simulates a cryptographic accumulator and on-chain revocation registry.
 * Issuers maintain a compressed bitstring or Merkle tree accumulator.
 * Revoking a credential updates the accumulator root.
 */
export class RevocationAccumulator {
  private revokedIndices: Set<number> = new Set();
  private stateRoot: string;

  constructor(initialRevoked: number[] = [12]) {
    this.revokedIndices = new Set(initialRevoked);
    this.stateRoot = this.recomputeRoot();
  }

  private recomputeRoot(): string {
    const sorted = Array.from(this.revokedIndices).sort((a, b) => a - b);
    return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
  }

  public revoke(index: number): { success: boolean; newStateRoot: string } {
    this.revokedIndices.add(index);
    this.stateRoot = this.recomputeRoot();
    return { success: true, newStateRoot: this.stateRoot };
  }

  public isRevoked(index: number): boolean {
    return this.revokedIndices.has(index);
  }

  public getStateRoot(): string {
    return this.stateRoot;
  }
}

export const globalRevocationRegistry = new RevocationAccumulator([12]);
