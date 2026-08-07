import { NextResponse } from "next/server";

import { jsonError, resolveRequestUser } from "../../../../../lib/api";
import { prisma } from "../../../../../lib/prisma";
import { createQuestion, listPaperDiscussions } from "../../../../../lib/repositories/discussions";

type RouteContext = {
  params: Promise<{ paperId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { paperId } = await context.params;
  const discussions = await listPaperDiscussions(prisma, paperId);

  return NextResponse.json(discussions);
}

export async function POST(request: Request, context: RouteContext) {
  const { paperId } = await context.params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || typeof body.body !== "string" || body.body.trim().length === 0) {
    return jsonError("Question body is required");
  }

  const userId = await resolveRequestUser(prisma, request);
  const discussion = await createQuestion(prisma, {
    paperId,
    userId,
    body: body.body.trim(),
    anchor: body.anchor
      ? {
          kind: body.anchor.kind ?? "manual",
          quoteText: body.anchor.quoteText ?? body.anchor.quote_text ?? null,
          contextText: body.anchor.contextText ?? body.anchor.context_text ?? null,
          sourceUrl: body.anchor.sourceUrl ?? body.anchor.source_url ?? null,
          imageUrl: body.anchor.imageUrl ?? body.anchor.image_url ?? null,
          note: body.anchor.note ?? null
        }
      : null
  });

  return NextResponse.json(discussion, { status: 201 });
}
