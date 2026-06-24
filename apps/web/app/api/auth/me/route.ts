import { jsonError } from "../../../../lib/api";
import { getCurrentUserId } from "../../../../lib/auth/currentUser";
import { publicUser } from "../../../../lib/auth/routeHelpers";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  const userId = await getCurrentUserId(prisma, request);
  if (!userId) {
    return jsonError("Not authenticated", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    return jsonError("Not authenticated", 401);
  }

  return Response.json(publicUser(user));
}
