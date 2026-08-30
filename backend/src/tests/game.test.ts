import { describe, expect, test } from "bun:test";
import { GraphQLError } from "graphql";
import { resolvers } from "../schema";
import { createFakePrisma, type FakePrisma } from "./fakePrisma";
import type { GraphQLContext } from "../context";

function makeCtx(prisma: FakePrisma, userId: string | null = null): GraphQLContext {
  return { prisma: prisma as unknown as GraphQLContext["prisma"], userId };
}

describe("Mutation.register (real resolver)", () => {
  test("creates a user and returns a token + user payload", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma);

    const payload = await resolvers.Mutation.register(
      null,
      { email: "alex@example.com", password: "secret123" },
      ctx
    );

    expect(payload.user.email).toBe("alex@example.com");
    expect(typeof payload.token).toBe("string");
    // The stored password must never be the plaintext value.
    expect(prisma.__state.users[0]!.password).not.toBe("secret123");
  });

  test("rejects an invalid email", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma);

    await expect(
      resolvers.Mutation.register(null, { email: "not-an-email", password: "secret123" }, ctx)
    ).rejects.toThrow(GraphQLError);
  });

  test("rejects a password shorter than 6 characters", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma);

    await expect(
      resolvers.Mutation.register(null, { email: "alex@example.com", password: "123" }, ctx)
    ).rejects.toThrow(GraphQLError);
  });

  test("rejects registering an email that is already in use", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma);

    await resolvers.Mutation.register(null, { email: "alex@example.com", password: "secret123" }, ctx);

    await expect(
      resolvers.Mutation.register(null, { email: "alex@example.com", password: "different1" }, ctx)
    ).rejects.toThrow("Email already registered");
  });
});

describe("Mutation.login (real resolver)", () => {
  test("logs in successfully with correct credentials", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma);
    await resolvers.Mutation.register(null, { email: "sam@example.com", password: "correcthorse" }, ctx);

    const payload = await resolvers.Mutation.login(
      null,
      { email: "sam@example.com", password: "correcthorse" },
      ctx
    );

    expect(payload.user.email).toBe("sam@example.com");
    expect(typeof payload.token).toBe("string");
  });

  test("rejects a login with the wrong password", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma);
    await resolvers.Mutation.register(null, { email: "sam@example.com", password: "correcthorse" }, ctx);

    await expect(
      resolvers.Mutation.login(null, { email: "sam@example.com", password: "wrongpassword" }, ctx)
    ).rejects.toThrow("Invalid email or password");
  });

  test("rejects a login for an email that was never registered", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma);

    await expect(
      resolvers.Mutation.login(null, { email: "ghost@example.com", password: "whatever1" }, ctx)
    ).rejects.toThrow("Invalid email or password");
  });
});

describe("Mutation.saveGameResult (real resolver)", () => {
  test("rejects an unauthenticated request", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma, null);

    await expect(
      resolvers.Mutation.saveGameResult(
        null,
        { timeSeconds: 10, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 },
        ctx
      )
    ).rejects.toThrow("Not authenticated");
  });

  test("rejects invalid game data (non-positive time)", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma, "user-1");

    await expect(
      resolvers.Mutation.saveGameResult(
        null,
        { timeSeconds: 0, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 },
        ctx
      )
    ).rejects.toThrow("Invalid game result data");
  });

  test("saves a valid result associated with the authenticated user", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma, "user-1");

    const result = await resolvers.Mutation.saveGameResult(
      null,
      { timeSeconds: 9.87, correctChars: 20, wrongAttempts: 2, penaltyTime: 1.0 },
      ctx
    );

    expect(result.userId).toBe("user-1");
    expect(result.timeSeconds).toBe(9.87);
  });
});

describe("Query.myGameHistory (real resolver)", () => {
  test("rejects an unauthenticated request", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma, null);

    await expect(resolvers.Query.myGameHistory(null, {}, ctx)).rejects.toThrow(
      "Not authenticated"
    );
  });

  test("only returns the authenticated user's own results, never another user's", async () => {
    const prisma = createFakePrisma();
    await resolvers.Mutation.saveGameResult(
      null,
      { timeSeconds: 10, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 },
      makeCtx(prisma, "user-1")
    );
    await resolvers.Mutation.saveGameResult(
      null,
      { timeSeconds: 8, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 },
      makeCtx(prisma, "user-2")
    );

    const history = await resolvers.Query.myGameHistory(null, {}, makeCtx(prisma, "user-1"));

    expect(history).toHaveLength(1);
    expect(history[0]!.userId).toBe("user-1");
  });
});

describe("Query.myBestScore - high-score calculation (real resolver)", () => {
  test("returns null when the user is not authenticated", async () => {
    const prisma = createFakePrisma();
    const best = await resolvers.Query.myBestScore(null, {}, makeCtx(prisma, null));
    expect(best).toBeNull();
  });

  test("returns null when the user has no games yet", async () => {
    const prisma = createFakePrisma();
    const best = await resolvers.Query.myBestScore(null, {}, makeCtx(prisma, "user-1"));
    expect(best).toBeNull();
  });

  test("returns the lowest (best) time among the user's results", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma, "user-1");
    for (const timeSeconds of [12.5, 9.2, 10.1]) {
      await resolvers.Mutation.saveGameResult(
        null,
        { timeSeconds, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 },
        ctx
      );
    }

    const best = await resolvers.Query.myBestScore(null, {}, ctx);
    expect(best?.timeSeconds).toBe(9.2);
  });
});

describe("Query.myGameStats - analytics (real resolver)", () => {
  test("rejects an unauthenticated request", async () => {
    const prisma = createFakePrisma();

    await expect(resolvers.Query.myGameStats(null, {}, makeCtx(prisma, null))).rejects.toThrow(
      "Not authenticated"
    );
  });

  test("returns an empty analytics summary when the user has no games yet", async () => {
    const prisma = createFakePrisma();

    const stats = await resolvers.Query.myGameStats(null, {}, makeCtx(prisma, "user-1"));

    expect(stats).toEqual({
      gamesPlayed: 0,
      bestTime: null,
      averageTime: null,
      averageWrongAttempts: null,
      averagePenaltyTime: null,
      lastPlayedAt: null,
    });
  });

  test("derives averages and best time from the authenticated user's own results", async () => {
    const prisma = createFakePrisma();
    const ctx = makeCtx(prisma, "user-1");

    await resolvers.Mutation.saveGameResult(
      null,
      { timeSeconds: 12.25, correctChars: 20, wrongAttempts: 3, penaltyTime: 1.5 },
      ctx
    );
    await resolvers.Mutation.saveGameResult(
      null,
      { timeSeconds: 8.5, correctChars: 20, wrongAttempts: 1, penaltyTime: 0.5 },
      ctx
    );
    await resolvers.Mutation.saveGameResult(
      null,
      { timeSeconds: 10.75, correctChars: 20, wrongAttempts: 2, penaltyTime: 1.0 },
      makeCtx(prisma, "user-2")
    );

    const stats = await resolvers.Query.myGameStats(null, {}, ctx);

    expect(stats.gamesPlayed).toBe(2);
    expect(stats.bestTime).toBe(8.5);
    expect(stats.averageTime).toBe(10.38);
    expect(stats.averageWrongAttempts).toBe(2);
    expect(stats.averagePenaltyTime).toBe(1);
    expect(typeof stats.lastPlayedAt).toBe("string");
  });
});

describe("Query.leaderboard - leaderboard ordering (real resolver)", () => {
  test("orders entries ascending by best time (lower time is better)", async () => {
    const prisma = createFakePrisma();
    const alex = await resolvers.Mutation.register(null, { email: "alex@example.com", password: "secret123" }, makeCtx(prisma));
    const john = await resolvers.Mutation.register(null, { email: "john@example.com", password: "secret123" }, makeCtx(prisma));
    const sarah = await resolvers.Mutation.register(null, { email: "sarah@example.com", password: "secret123" }, makeCtx(prisma));

    await resolvers.Mutation.saveGameResult(null, { timeSeconds: 9.15, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 }, makeCtx(prisma, john.user.id));
    await resolvers.Mutation.saveGameResult(null, { timeSeconds: 8.42, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 }, makeCtx(prisma, alex.user.id));
    await resolvers.Mutation.saveGameResult(null, { timeSeconds: 9.87, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 }, makeCtx(prisma, sarah.user.id));

    const leaderboard = await resolvers.Query.leaderboard(null, {}, makeCtx(prisma));

    expect(leaderboard.map((e) => e.email)).toEqual([
      "alex@example.com",
      "john@example.com",
      "sarah@example.com",
    ]);
    expect(leaderboard[0]!.bestTime).toBe(8.42);
  });

  test("only shows each user's single best time, not every run", async () => {
    const prisma = createFakePrisma();
    const alex = await resolvers.Mutation.register(null, { email: "alex@example.com", password: "secret123" }, makeCtx(prisma));
    const ctx = makeCtx(prisma, alex.user.id);

    await resolvers.Mutation.saveGameResult(null, { timeSeconds: 12.0, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 }, ctx);
    await resolvers.Mutation.saveGameResult(null, { timeSeconds: 8.0, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 }, ctx);
    await resolvers.Mutation.saveGameResult(null, { timeSeconds: 10.0, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 }, ctx);

    const leaderboard = await resolvers.Query.leaderboard(null, {}, makeCtx(prisma));

    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0]!.bestTime).toBe(8.0);
  });

  test("respects the limit argument", async () => {
    const prisma = createFakePrisma();
    for (const [email, time] of [
      ["a@example.com", 5],
      ["b@example.com", 6],
      ["c@example.com", 7],
    ] as const) {
      const u = await resolvers.Mutation.register(null, { email, password: "secret123" }, makeCtx(prisma));
      await resolvers.Mutation.saveGameResult(null, { timeSeconds: time, correctChars: 20, wrongAttempts: 0, penaltyTime: 0 }, makeCtx(prisma, u.user.id));
    }

    const leaderboard = await resolvers.Query.leaderboard(null, { limit: 2 }, makeCtx(prisma));
    expect(leaderboard).toHaveLength(2);
  });
});
