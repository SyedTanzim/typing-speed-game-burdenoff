import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { z } from "zod";
import { hashPassword, verifyPassword, signToken } from "./utils/auth";
import type { GraphQLContext } from "./context";

const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    email: String!
    createdAt: String!
  }

  type GameResult {
    id: ID!
    timeSeconds: Float!
    correctChars: Int!
    wrongAttempts: Int!
    penaltyTime: Float!
    createdAt: String!
  }

  type LeaderboardEntry {
    email: String!
    bestTime: Float!
  }

  type GameStats {
    gamesPlayed: Int!
    bestTime: Float
    averageTime: Float
    averageWrongAttempts: Float
    averagePenaltyTime: Float
    lastPlayedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    myGameHistory: [GameResult!]!
    myBestScore: GameResult
    myGameStats: GameStats!
    leaderboard(limit: Int): [LeaderboardEntry!]!
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    saveGameResult(
      timeSeconds: Float!
      correctChars: Int!
      wrongAttempts: Int!
      penaltyTime: Float!
    ): GameResult!
  }
`;

const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function requireAuth(ctx: GraphQLContext): string {
  if (!ctx.userId) {
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.userId;
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

const resolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) return null;
      return ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
    },

    myGameHistory: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return ctx.prisma.gameResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    },

    myBestScore: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) return null;

      return ctx.prisma.gameResult.findFirst({
        where: {
          userId: ctx.userId,
        },
        orderBy: {
          timeSeconds: "asc",
        },
      });
    },

    myGameStats: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const results = await ctx.prisma.gameResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (results.length === 0) {
        return {
          gamesPlayed: 0,
          bestTime: null,
          averageTime: null,
          averageWrongAttempts: null,
          averagePenaltyTime: null,
          lastPlayedAt: null,
        };
      }

      const totals = results.reduce(
        (acc, result) => ({
          timeSeconds: acc.timeSeconds + result.timeSeconds,
          wrongAttempts: acc.wrongAttempts + result.wrongAttempts,
          penaltyTime: acc.penaltyTime + result.penaltyTime,
        }),
        { timeSeconds: 0, wrongAttempts: 0, penaltyTime: 0 }
      );

      return {
        gamesPlayed: results.length,
        bestTime: Math.min(...results.map((result) => result.timeSeconds)),
        averageTime: roundToTwo(totals.timeSeconds / results.length),
        averageWrongAttempts: roundToTwo(totals.wrongAttempts / results.length),
        averagePenaltyTime: roundToTwo(totals.penaltyTime / results.length),
        lastPlayedAt: results[0]!.createdAt.toISOString(),
      };
    },

    leaderboard: async (
      _parent: unknown,
      args: { limit?: number },
      ctx: GraphQLContext
    ) => {
      const limit = args.limit ?? 10;

      const results = await ctx.prisma.gameResult.findMany({
        orderBy: { timeSeconds: "asc" },
        include: { user: { select: { email: true } } },
      });

      const bestByUser = new Map<string, number>();
      for (const r of results) {
        if (!bestByUser.has(r.userId)) {
          bestByUser.set(r.userId, r.timeSeconds);
        }
      }

      return Array.from(bestByUser.entries())
        .map(([userId, bestTime]) => {
          const match = results.find((r) => r.userId === userId)!;
          return { email: match.user.email, bestTime };
        })
        .sort((a, b) => a.bestTime - b.bestTime)
        .slice(0, limit);
    },
  },

  Mutation: {
    register: async (
      _parent: unknown,
      args: { email: string; password: string },
      ctx: GraphQLContext
    ) => {
      const parsed = credentialsSchema.safeParse(args);
      if (!parsed.success) {
        throw new GraphQLError(
          parsed.error.issues[0]?.message ?? "Invalid input",
          { extensions: { code: "BAD_USER_INPUT" } }
        );
      }

      const existing = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (existing) {
        throw new GraphQLError("Email already registered", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const hashed = await hashPassword(args.password);
      const user = await ctx.prisma.user.create({
        data: { email: args.email, password: hashed },
      });

      return { token: signToken(user.id), user };
    },

    login: async (
      _parent: unknown,
      args: { email: string; password: string },
      ctx: GraphQLContext
    ) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) {
        throw new GraphQLError("Invalid email or password", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const valid = await verifyPassword(args.password, user.password);
      if (!valid) {
        throw new GraphQLError("Invalid email or password", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      return { token: signToken(user.id), user };
    },

    saveGameResult: async (
      _parent: unknown,
      args: {
        timeSeconds: number;
        correctChars: number;
        wrongAttempts: number;
        penaltyTime: number;
      },
      ctx: GraphQLContext
    ) => {
      const userId = requireAuth(ctx);

      if (args.timeSeconds <= 0 || args.correctChars < 0 || args.wrongAttempts < 0) {
        throw new GraphQLError("Invalid game result data", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      return ctx.prisma.gameResult.create({
        data: { ...args, userId },
      });
    },
  },
};

export { resolvers };
export const schema = createSchema({ typeDefs, resolvers });
