import { NextResponse } from "next/server";

import { jsonError, resolveRequestUser } from "../../../../../lib/api";
import { prisma } from "../../../../../lib/prisma";
import { createDiscussionReply } from "../../../../../lib/repositories/discussions";

type RouteContext = {
  params: Promise<{ discussionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { discussionId } = await context.params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || typeof body.body !== "string" || body.body.trim().length === 0) {
    return jsonError("Reply body is required");
  }

  const kind = typeof body.kind === "string" ? body.kind : "comment";
  if (!["answer", "comment", "author_response", "correction", "replication_note"].includes(kind)) {
    return jsonError("Invalid reply kind");
  }

  const userId = await resolveRequestUser(prisma, request);
  const reply = await createDiscussionReply(prisma, {
    discussionId,
    userId,
    kind: kind as "answer" | "comment" | "author_response" | "correction" | "replication_note",
    body: body.body.trim(),
    parentReplyId: body.parentReplyId ?? body.parent_reply_id ?? null,
    isAuthorResponse: Boolean(body.isAuthorResponse ?? body.is_author_response)
  });

  return NextResponse.json(reply, { status: 201 });
}
