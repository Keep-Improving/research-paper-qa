import { NextResponse } from "next/server";

import { resolveRequestUser } from "../../../../lib/api";
import { prisma } from "../../../../lib/prisma";
import { listUserCollections } from "../../../../lib/repositories/collections";

export async function GET(request: Request) {
  const userId = await resolveRequestUser(prisma, request);
  const items = await listUserCollections(prisma, userId);

  return NextResponse.json(items);
}
