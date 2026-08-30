import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { MY_GAME_STATS_QUERY } from "../api/queries";
import { useAuth } from "../context/AuthContext";

type GameStatsData = {
  gamesPlayed: number;
  bestTime: number | null;
  averageTime: number | null;
  averageWrongAttempts: number | null;
  averagePenaltyTime: number | null;
  lastPlayedAt: string | null;
};

type GameStatsProps = {
  onOpenAuth: (mode: "login" | "register") => void;
  refreshKey?: number;
};

function formatSeconds(value: number | null): string {
  return value === null ? "--" : `${value.toFixed(2)}s`;
}

function formatNumber(value: number | null): string {
  return value === null ? "--" : value.toFixed(2).replace(/\.00$/, "");
}

function formatDate(value: string | null): string {
  if (!value) return "--";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function GameStats({ onOpenAuth, refreshKey = 0 }: GameStatsProps) {
  const { token, user } = useAuth();
  const [statsState, setStatsState] = useState<{
    userId: string;
    data: GameStatsData;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ userId: string; message: string } | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    let cancelled = false;
    const userId = user.id;

    async function load() {
      setLoading(true);
      try {
        setError(null);
        const client = getClient(token);
        const data = await client.request<{ myGameStats: GameStatsData }>(
          MY_GAME_STATS_QUERY
        );
        if (!cancelled) setStatsState({ userId, data: data.myGameStats });
      } catch {
        if (!cancelled) setError({ userId, message: "Failed to load stats" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, token, user]);

  if (!user) {
    return (
      <section className="bg-white/90 dark:bg-slate-950/88 border border-violet-100 dark:border-slate-800 rounded-2xl shadow-lg dark:shadow-black/25 overflow-hidden text-center py-8 px-7 transition-colors">
        <span className="text-violet-600 dark:text-violet-300 text-xs font-bold tracking-widest uppercase">
          YOUR STATS
        </span>
        <h2 className="mt-2 mb-0 text-xl font-bold text-indigo-950 dark:text-white">
          Progress
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-300 text-sm leading-relaxed">
          Sign up or log in to track your typing trends.
        </p>
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => onOpenAuth("login")}
            className="text-violet-600 dark:text-violet-300 font-bold rounded-full px-5 py-2 hover:bg-violet-50 dark:hover:bg-violet-500/15 transition-colors text-sm border border-violet-200 dark:border-slate-700 bg-transparent"
          >
            Login
          </button>
          <button
            onClick={() => onOpenAuth("register")}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-5 py-2 font-bold text-sm shadow-md hover:shadow-lg transition-all border-0"
          >
            Sign Up
          </button>
        </div>
      </section>
    );
  }

  const stats = statsState?.userId === user.id ? statsState.data : null;
  const currentError = error?.userId === user.id ? error.message : null;
  const pending = loading || Boolean(token && stats === null && !currentError);
  const rows = [
    ["Games", pending ? "--" : String(stats?.gamesPlayed ?? 0)],
    ["Best", pending ? "--" : formatSeconds(stats?.bestTime ?? null)],
    ["Average", pending ? "--" : formatSeconds(stats?.averageTime ?? null)],
    ["Mistakes", pending ? "--" : formatNumber(stats?.averageWrongAttempts ?? null)],
    ["Penalty", pending ? "--" : formatSeconds(stats?.averagePenaltyTime ?? null)],
    ["Latest", pending ? "--" : formatDate(stats?.lastPlayedAt ?? null)],
  ] as const;

  return (
    <section
      className="bg-white/90 dark:bg-slate-950/88 border border-violet-100 dark:border-slate-800 rounded-2xl shadow-lg dark:shadow-black/25 overflow-hidden transition-colors"
      aria-labelledby="stats-title"
    >
      <div className="px-7 pt-6 pb-4">
        <span className="text-violet-600 dark:text-violet-300 text-xs font-bold tracking-widest uppercase">
          YOUR STATS
        </span>
        <h2
          id="stats-title"
          className="m-0 text-2xl font-bold text-indigo-950 dark:text-white"
        >
          Progress
        </h2>
      </div>

      {currentError ? (
        <p className="px-7 pb-7 text-red-600 dark:text-red-300 text-sm">
          {currentError}
        </p>
      ) : (
        <dl className="m-0">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 px-7 py-3 border-t border-violet-100 dark:border-slate-800"
            >
              <dt className="text-slate-500 dark:text-slate-400 text-sm">
                {label}
              </dt>
              <dd className="m-0 text-indigo-950 dark:text-white font-bold tabular-nums text-sm">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
