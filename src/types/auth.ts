export type UserRole = 'holder' | 'issuer' | 'verifier' | 'developer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  did: string;
  organization?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: UserProfile;
}
