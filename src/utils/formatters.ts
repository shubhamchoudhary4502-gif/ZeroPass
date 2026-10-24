/**
 * Shortens a decentralized identifier for clean presentation
 * Example: did:zeropass:0x93427abc4235ef98124987 -> did:zeropass:0x9342...ef98
 */
export function formatDid(did: string, chars: number = 6): string {
  if (!did) return '';
  const parts = did.split(':');
  if (parts.length >= 3) {
    const prefix = parts.slice(0, parts.length - 1).join(':');
    const id = parts[parts.length - 1];
    if (id.length <= chars * 2) {
      return did;
    }
    return `${prefix}:${id.slice(0, chars)}...${id.slice(-chars)}`;
  }
  if (did.length <= chars * 2) return did;
  return `${did.slice(0, chars)}...${did.slice(-chars)}`;
}

/**
 * Formats ISO date string to readable format
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats ISO date with time
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats a cryptographic hash with middle ellipsis
 */
export function formatHash(hash: string, lead: number = 8, trail: number = 6): string {
  if (!hash) return '';
  if (hash.length <= lead + trail) return hash;
  return `${hash.slice(0, lead)}...${hash.slice(-trail)}`;
}
