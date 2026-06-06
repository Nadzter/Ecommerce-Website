import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@/prisma/generated/client";

import { prisma } from "./prisma";
import { getCurrentStudio } from "./tenant";

/**
 * Result of resolving the active request to a logged-in `User` plus the
 * studio they belong to. Pages that require a specific role use the helpers
 * below (`requireOwner`, `requireStaff`, `requireMember`) to assert the
 * caller's role and redirect otherwise.
 */
export interface AuthContext {
  user: User;
  studioId: string;
}

/**
 * Read the active Clerk session and resolve the matching `User` row from the
 * database. Returns `null` when the visitor is anonymous.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId: clerkId } = auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;

  return { user, studioId: user.studioId };
}

/**
 * Require a logged-in user, redirecting to Clerk's sign-in flow when the
 * visitor is anonymous.
 */
export async function requireUser(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }
  return ctx;
}

/**
 * Require the active user to belong to the current tenant. Throws a 404 if
 * the membership is inconsistent (for example a user signed into studio A
 * trying to access studio B's dashboard).
 */
export async function requireTenantUser(): Promise<AuthContext> {
  const ctx = await requireUser();
  const studio = await getCurrentStudio();
  if (ctx.studioId !== studio.id) {
    redirect("/sign-in");
  }
  return ctx;
}

/**
 * Require the active user to hold any of the listed roles. Redirects to the
 * member portal when the check fails so a member never hits a raw 403.
 */
export async function requireRole(
  allowed: readonly UserRole[],
): Promise<AuthContext> {
  const ctx = await requireTenantUser();
  if (!allowed.includes(ctx.user.role)) {
    redirect("/");
  }
  return ctx;
}

export const requireOwner = (): Promise<AuthContext> => requireRole(["OWNER"]);
export const requireStaff = (): Promise<AuthContext> =>
  requireRole(["OWNER", "STAFF"]);
export const requireMember = (): Promise<AuthContext> =>
  requireRole(["MEMBER", "STAFF", "OWNER"]);

/**
 * Return the Clerk user object plus our DB record. Useful when a page needs
 * profile metadata that lives on the Clerk side (e.g. `imageUrl`).
 */
export async function getFullUser() {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const clerkUser = await currentUser();
  return { clerk: clerkUser, db: ctx.user };
}
