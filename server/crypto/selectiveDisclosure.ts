/**
 * Calculates current completed age from ISO birthdate (YYYY-MM-DD),
 * strictly accounting for leap years, month, and day boundaries.
 */
export function calculateAgeFromBirthDate(birthDateIso: string, referenceDate: Date = new Date()): number {
  const birth = new Date(birthDateIso);
  if (isNaN(birth.getTime())) {
    throw new Error('Invalid birthdate format. Expected ISO date YYYY-MM-DD.');
  }

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export interface PredicateDefinition {
  attributeKey: string;
  attributeLabel: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: any;
  isZeroKnowledge: boolean;
}

/**
 * Evaluates a predicate against authenticated claims.
 * If the attribute is 'age' and only 'birthDate' is present, derives age via calendar semantics.
 */
export function evaluatePredicateCondition(
  predicate: PredicateDefinition,
  subjectClaims: Record<string, any>,
  referenceDate: Date = new Date()
): { satisfied: boolean; evaluatedValue?: any; error?: string } {
  let claimValue = subjectClaims[predicate.attributeKey];

  // Smart derivation for age predicate if birthDate is the primary credential claim
  if (predicate.attributeKey === 'age' && claimValue === undefined && subjectClaims['birthDate']) {
    try {
      claimValue = calculateAgeFromBirthDate(subjectClaims['birthDate'], referenceDate);
    } catch (e: any) {
      return { satisfied: false, error: e.message };
    }
  }

  if (claimValue === undefined || claimValue === null) {
    return { satisfied: false, error: `Claim '${predicate.attributeKey}' not found in credential subject.` };
  }

  const { operator, value: targetValue } = predicate;

  switch (operator) {
    case 'eq':
      return {
        satisfied: claimValue === targetValue || String(claimValue).toLowerCase() === String(targetValue).toLowerCase(),
        evaluatedValue: predicate.isZeroKnowledge ? '[ZK PROVEN]' : claimValue,
      };
    case 'neq':
      return {
        satisfied: claimValue !== targetValue,
        evaluatedValue: predicate.isZeroKnowledge ? '[ZK PROVEN]' : claimValue,
      };
    case 'gt': {
      const numSubject = Number(claimValue);
      const numTarget = Number(targetValue);
      if (isNaN(numSubject) || isNaN(numTarget)) return { satisfied: false, error: 'Non-numeric comparison' };
      return {
        satisfied: numSubject > numTarget,
        evaluatedValue: predicate.isZeroKnowledge ? '[ZK PROVEN]' : claimValue,
      };
    }
    case 'gte': {
      const numSubject = Number(claimValue);
      const numTarget = Number(targetValue);
      if (isNaN(numSubject) || isNaN(numTarget)) return { satisfied: false, error: 'Non-numeric comparison' };
      return {
        satisfied: numSubject >= numTarget,
        evaluatedValue: predicate.isZeroKnowledge ? '[ZK PROVEN]' : claimValue,
      };
    }
    case 'lt': {
      const numSubject = Number(claimValue);
      const numTarget = Number(targetValue);
      if (isNaN(numSubject) || isNaN(numTarget)) return { satisfied: false, error: 'Non-numeric comparison' };
      return {
        satisfied: numSubject < numTarget,
        evaluatedValue: predicate.isZeroKnowledge ? '[ZK PROVEN]' : claimValue,
      };
    }
    case 'lte': {
      const numSubject = Number(claimValue);
      const numTarget = Number(targetValue);
      if (isNaN(numSubject) || isNaN(numTarget)) return { satisfied: false, error: 'Non-numeric comparison' };
      return {
        satisfied: numSubject <= numTarget,
        evaluatedValue: predicate.isZeroKnowledge ? '[ZK PROVEN]' : claimValue,
      };
    }
    case 'in': {
      if (!Array.isArray(targetValue)) return { satisfied: false, error: 'Target value must be an array for in operator' };
      return {
        satisfied: targetValue.includes(claimValue),
        evaluatedValue: predicate.isZeroKnowledge ? '[ZK PROVEN]' : claimValue,
      };
    }
    default:
      return { satisfied: false, error: `Unsupported operator: ${operator}` };
  }
}

/**
 * Performs selective disclosure on authenticated claims.
 * Only returns claims that are explicitly permitted by policy.
 */
export function extractSelectivelyDisclosedClaims(
  subjectClaims: Record<string, any>,
  allowedClaimKeys: string[]
): Record<string, any> {
  const disclosed: Record<string, any> = {};
  for (const key of allowedClaimKeys) {
    if (subjectClaims[key] !== undefined && key !== 'id') {
      disclosed[key] = subjectClaims[key];
    }
  }
  return disclosed;
}
