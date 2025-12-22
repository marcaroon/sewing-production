// src/lib/auth.ts
import { cookies } from "next/headers";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_EXPIRY_DAYS = 1;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  department: string;
  role: string;
  avatar?: string;
  isAdmin?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });

  return token;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        avatar: true,
        isActive: true,
        isAdmin: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
      role: user.role,
      avatar: user.avatar || undefined,
      isAdmin: user.isAdmin,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function hasPermission(
  user: SessionUser,
  requiredRole: string
): boolean {
  if (user.isAdmin) return true;

  const roleHierarchy = {
    admin: 5,
    ppic: 4,
    qc: 3,
    cutting: 2,
    sewing: 2,
    warehouse: 2,
    packing: 2,
    shipping: 2,
  };

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel =
    roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

export async function validateSession(token: string): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isActive: true },
    });

    return user?.isActive || false;
  } catch (error) {
    console.error("Error validating session:", error);
    return false;
  }
}
