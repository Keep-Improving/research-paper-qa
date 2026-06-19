import { NextResponse } from "next/server";

import { jsonError } from "../../../../lib/api";
import { prisma } from "../../../../lib/prisma";
import { getDiscussionDetail } from "../../../../lib/repositories/discussions";

type RouteContext = {
  params: Promise<{ discussionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { discussionId } = await context.params;
  const discussion = await getDiscussionDetail(prisma, discussionId);

  if (!discussion) {
    return jsonError("Discussion not found", 404);
  }

  return NextResponse.json(discussion);
}
