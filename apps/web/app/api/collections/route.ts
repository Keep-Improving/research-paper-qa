import { NextResponse } from "next/server";

import { jsonError, resolveRequestUser } from "../../../lib/api";
import { prisma } from "../../../lib/prisma";
import { addCollectionItem } from "../../../lib/repositories/collections";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonError("Invalid JSON body");
  }

  const targetType = body.targetType ?? body.target_type;
  const targetId = body.targetId ?? body.target_id;
  if (!["paper", "discussion", "anchor"].includes(targetType) || typeof targetId !== "string") {
    return jsonError("Collection target is required");
  }

  const userId = await resolveRequestUser(prisma, request);
  const item = await addCollectionItem(prisma, {
    userId,
    targetType,
    targetId,
    note: body.note ?? null
  });

  return NextResponse.json(item, { status: 201 });
}
