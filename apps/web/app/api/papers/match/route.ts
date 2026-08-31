import { NextResponse } from "next/server";

import { jsonError } from "../../../../lib/api";
import { prisma } from "../../../../lib/prisma";
import { isBlockedPaperUrl, matchPaper } from "../../../../lib/repositories/papers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonError("Invalid JSON body");
  }

  if (isBlockedPaperUrl(typeof body.url === "string" ? body.url : null)) {
    return jsonError("This page is not a supported paper source.", 422);
  }

  const paper = await matchPaper(prisma, body);

  return NextResponse.json(paper, { status: 200 });
}
