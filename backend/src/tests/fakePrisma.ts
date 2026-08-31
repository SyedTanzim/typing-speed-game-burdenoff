/**
 * A minimal in-memory stand-in for the Prisma client, implementing just the
 * calls schema.ts actually makes (user.findUnique/create, gameResult.create/
 * findMany/findFirst). This lets us exercise the *real* resolver logic in
 * schema.ts against realistic data, without needing a live Postgres
 * connection during `bun test`.
 */

type FakeUser = {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
};

type FakeGameResult = {
  id: string;
  userId: string;
  timeSeconds: number;
  correctChars: number;
  wrongAttempts: number;
  penaltyTime: number;
  createdAt: Date;
};

/**
 * Creates an in-memory Prisma substitute so resolver tests can exercise database
 * behavior deterministically without starting PostgreSQL.
 */
export function createFakePrisma() {
  const users: FakeUser[] = [];
  const results: FakeGameResult[] = [];
  let userSeq = 0;
  let resultSeq = 0;

  return {
    // Exposed so tests can seed/inspect state directly if needed.
    __state: { users, results },

    user: {
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return users.find((u) => u.id === where.id) ?? null;
        if (where.email) return users.find((u) => u.email === where.email) ?? null;
        return null;
      },
      create: async ({ data }: { data: { email: string; password: string } }) => {
        const user: FakeUser = {
          id: `user-${++userSeq}`,
          createdAt: new Date(),
          ...data,
        };
        users.push(user);
        return user;
      },
    },

    gameResult: {
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          timeSeconds: number;
          correctChars: number;
          wrongAttempts: number;
          penaltyTime: number;
        };
      }) => {
        const result: FakeGameResult = {
          id: `result-${++resultSeq}`,
          createdAt: new Date(),
          ...data,
        };
        results.push(result);
        return result;
      },
      findMany: async (args: {
        where?: { userId?: string };
        orderBy?: { createdAt?: "asc" | "desc"; timeSeconds?: "asc" | "desc" };
        include?: { user?: { select?: { email?: boolean } } };
      }) => {
        let rows = args.where?.userId
          ? results.filter((r) => r.userId === args.where!.userId)
          : [...results];

        if (args.orderBy?.timeSeconds) {
          rows = rows.sort((a, b) =>
            args.orderBy!.timeSeconds === "asc"
              ? a.timeSeconds - b.timeSeconds
              : b.timeSeconds - a.timeSeconds
          );
        }
        if (args.orderBy?.createdAt) {
          rows = rows.sort((a, b) =>
            args.orderBy!.createdAt === "asc"
              ? a.createdAt.getTime() - b.createdAt.getTime()
              : b.createdAt.getTime() - a.createdAt.getTime()
          );
        }

        if (args.include?.user) {
          return rows.map((r) => ({
            ...r,
            user: { email: users.find((u) => u.id === r.userId)?.email ?? "" },
          }));
        }
        return rows;
      },
      findFirst: async (args: {
        where: { userId: string };
        orderBy?: { timeSeconds?: "asc" | "desc" };
      }) => {
        let rows = results.filter((r) => r.userId === args.where.userId);
        if (args.orderBy?.timeSeconds === "asc") {
          rows = rows.sort((a, b) => a.timeSeconds - b.timeSeconds);
        }
        return rows[0] ?? null;
      },
    },
  };
}

export type FakePrisma = ReturnType<typeof createFakePrisma>;
