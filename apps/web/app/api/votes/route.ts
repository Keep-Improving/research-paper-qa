import { NextResponse } from "next/server";

import { jsonError, resolveRequestUser } from "../../../lib/api";
import { prisma } from "../../../lib/prisma";
import { createVote } from "../../../lib/repositories/discussions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonError("Invalid JSON body");
  }

  const value = body.value;
  if (!["up", "down", "helpful"].includes(value)) {
    return jsonError("Invalid vote value");
  }

  const discussionId = body.discussionId ?? body.discussion_id ?? null;
  const replyId = body.replyId ?? body.reply_id ?? null;
  if (!discussionId && !replyId) {
    return jsonError("Vote target is required");
  }

  const userId = await resolveRequestUser(prisma, request);
  const vote = await createVote(prisma, {
    userId,
    value,
    discussionId,
    replyId
  });

  return NextResponse.json(vote, { status: 201 });
}
