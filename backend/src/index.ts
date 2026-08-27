import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { createContext } from "./context";

const allowedOrigin = process.env.FRONTEND_URL ?? "http://localhost:5173";
const cleanedOrigin = allowedOrigin.replace(/\/$/, "");

const yoga = createYoga({
  schema,
  context: ({ request }) => createContext(request),
  graphqlEndpoint: "/graphql",
  cors: {
    origin: [cleanedOrigin, "http://localhost:5173"],
    credentials: true,
  },
});

const port = Number(process.env.PORT) || 4000;

const server = Bun.serve({
  port,
  fetch: yoga.fetch,
});

console.log(`GraphQL server running on port ${port}`);