import { NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";
import { listOpenReports } from "../../../../lib/repositories/moderation";

export async function GET() {
  const reports = await listOpenReports(prisma);

  return NextResponse.json(reports);
}
