import { NextResponse } from "next/server";

import { jsonError, resolveRequestUser } from "../../../lib/api";
import { prisma } from "../../../lib/prisma";
import { createModerationReport } from "../../../lib/repositories/moderation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonError("Invalid JSON body");
  }

  const targetType = body.targetType ?? body.target_type;
  const targetId = body.targetId ?? body.target_id;
  const reason = body.reason;
  if (!["discussion", "reply", "anchor", "paper"].includes(targetType) || typeof targetId !== "string") {
    return jsonError("Report target is required");
  }

  if (typeof reason !== "string" || reason.trim().length === 0) {
    return jsonError("Report reason is required");
  }

  const userId = await resolveRequestUser(prisma, request);
  const report = await createModerationReport(prisma, {
    userId,
    targetType,
    targetId,
    reason: reason.trim()
  });

  return NextResponse.json(report, { status: 201 });
}
