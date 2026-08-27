import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { createContext } from "./context";
import { prisma } from "./prisma";

const configuredOrigins =
  process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? "http://localhost:5173";

const allowedOrigins = configuredOrigins
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const yoga = createYoga({
  schema,
  context: ({ request }) => createContext(request),
  graphqlEndpoint: "/graphql",
  cors: {
    origin: [...new Set([...allowedOrigins, "http://localhost:5173"])],
  },
});

const port = Number(process.env.PORT) || 4000;

function sanitizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://***@");
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return Response.json({ ok: true, database: "connected" });
      } catch (error) {
        console.error("Database health check failed", error);
        return Response.json(
          {
            ok: false,
            database: "error",
            message: sanitizeErrorMessage(error),
          },
          { status: 500 }
        );
      }
    }

    return yoga.fetch(request);
  },
});

console.log(`GraphQL server running on port ${port}`);
