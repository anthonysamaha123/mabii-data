import { NextResponse } from "next/server";
import { issueToken } from "@/lib/survey/integrity";

export const dynamic = "force-dynamic";

// Issues a short-lived signed timing token. The form fetches this on mount;
// the submit handler rejects submissions that come back faster than the
// minimum completion time or with an invalid/expired token.
export async function GET() {
  return NextResponse.json(
    { token: issueToken() },
    { headers: { "cache-control": "no-store" } }
  );
}
