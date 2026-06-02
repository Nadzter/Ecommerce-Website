import { prisma } from "./prisma";

/**
 * Add `amount` credits to a member's aggregate balance. Tenant-scoped via
 * a where filter on `studioId` so a misconfigured caller cannot grant
 * credits to a user belonging to another studio.
 *
 * Returns the new balance.
 */
export async function addCredits(
  userId: string,
  amount: number,
  studioId: string,
): Promise<number> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`addCredits requires a positive integer amount, got ${amount}`);
  }
  const result = await prisma.user.update({
    where: { id: userId, studioId },
    data: { creditsBalance: { increment: amount } },
    select: { creditsBalance: true },
  });
  return result.creditsBalance;
}

/**
 * Decrement the member's balance by one. Throws `InsufficientCreditsError`
 * when the balance is zero so callers can react (redirect to membership
 * purchase, etc.).
 */
export class InsufficientCreditsError extends Error {
  constructor(public readonly userId: string) {
    super(`User ${userId} has no credits remaining`);
    this.name = "InsufficientCreditsError";
  }
}

export async function deductCredit(
  userId: string,
  studioId: string,
): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findFirst({
      where: { id: userId, studioId },
      select: { creditsBalance: true },
    });
    if (!current) {
      throw new Error(`User ${userId} not found in studio ${studioId}`);
    }
    if (current.creditsBalance <= 0) {
      throw new InsufficientCreditsError(userId);
    }
    const updated = await tx.user.update({
      where: { id: userId },
      data: { creditsBalance: { decrement: 1 } },
      select: { creditsBalance: true },
    });
    return updated.creditsBalance;
  });
  return result;
}

/**
 * Return the member's current credit balance without mutating state.
 */
export async function getBalance(
  userId: string,
  studioId: string,
): Promise<number> {
  const row = await prisma.user.findFirst({
    where: { id: userId, studioId },
    select: { creditsBalance: true },
  });
  return row?.creditsBalance ?? 0;
}
