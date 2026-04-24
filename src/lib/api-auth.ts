import { auth } from "@/lib/auth";
import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const ISSUER = "anatolia-carpool";
const AUDIENCE = "mobile";
const EXPIRES_IN = "30d";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export interface AuthedUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

export async function signMobileJWT(user: AuthedUser): Promise<string> {
  return await new SignJWT({ name: user.name ?? null, email: user.email ?? null })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRES_IN)
    .sign(secret());
}

async function verifyBearer(token: string): Promise<AuthedUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      name: (payload.name as string | null | undefined) ?? null,
      email: (payload.email as string | null | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

// Resolves the authenticated user from either:
//   1. Authorization: Bearer <jwt> (mobile app)
//   2. NextAuth session cookie (web app)
// Returns null if neither is valid.
export async function getAuthedUser(request: Request): Promise<AuthedUser | null> {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    const user = await verifyBearer(token);
    if (user) return user;
  }
  const session = await auth();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    };
  }
  return null;
}
