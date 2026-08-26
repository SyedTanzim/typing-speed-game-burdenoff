import { prisma } from "./prisma";
import { verifyToken } from "./utils/auth";

export type GraphQLContext = {
  prisma: typeof prisma;
  userId: string | null;
};

export async function createContext(request: Request): Promise<GraphQLContext> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  let userId: string | null = null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) userId = payload.userId;
  }

  return { prisma, userId };
}