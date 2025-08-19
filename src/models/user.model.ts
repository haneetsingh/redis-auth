export interface UserRecord {
  username: string;
  passwordHash: string;
  createdAt: string;
  passwordVersion: number;
  lastLogin: null | string;
}
