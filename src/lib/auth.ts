import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || 'yukgo-admin-secret-2026-change-this'
);

const COOKIE_NAME = 'yukgo-admin-session';

// Default admin credentials (change in production!)
const ADMIN_USERS = [
  {
    username: 'admin',
    password: 'yukgo2026',
    name: 'Admin'
  }
];

export interface SessionData {
  username: string;
  name: string;
  iat: number;
}

export async function createSession(username: string, name: string): Promise<string> {
  const token = await new SignJWT({ username, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
  
  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  return verifySession(token);
}

export function validateCredentials(username: string, password: string): { valid: boolean; name?: string } {
  const user = ADMIN_USERS.find(
    u => u.username === username && u.password === password
  );
  
  if (user) {
    return { valid: true, name: user.name };
  }
  
  return { valid: false };
}

export { COOKIE_NAME };
