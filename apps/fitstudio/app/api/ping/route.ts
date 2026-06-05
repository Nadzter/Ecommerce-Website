import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Trivial liveness endpoint with no external dependencies. Used to confirm
 * a deployment actually shipped the latest route table.
 */
export async function GET(): Promise<Response> {
  return NextResponse.json({
    ok: true,
    version: 2,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
    ts: new Date().toISOString(),
  });
}
