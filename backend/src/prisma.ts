import { PrismaClient } from "@prisma/client";

/** Shared generated database client used by the server context and health check. */
export const prisma = new PrismaClient();