import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { createContext } from "./context";

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

const server = Bun.serve({
  port,
  fetch: yoga.fetch,
});

console.log(`GraphQL server running on port ${port}`);
