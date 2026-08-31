import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { LEADERBOARD_QUERY } from "../api/queries";

type Entry = { email: string; bestTime: number };

type LeaderboardProps = {
  userEmail?: string | null;
  onOpenAuth: (mode: "login" | "register") => void;
  refreshKey?: number;
};

/** Loads and renders the public top-ten ranking with loading, error, and empty states. */
export function Leaderboard({ userEmail, onOpenAuth, refreshKey = 0 }: LeaderboardProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reloads after saved results and whenever the browser regains focus.
  useEffect(() => {
    let cancelled = false;

    /** Fetches ranked entries and ignores responses received after cleanup. */
    async function load() {
      try {
        setError(null);
        const client = getClient();
        const data: any = await client.request(LEADERBOARD_QUERY, { limit: 10 });
        if (!cancelled) setEntries(data.leaderboard);
      } catch (err) {
        if (!cancelled) setError("Failed to load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    window.addEventListener("focus", load);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, [refreshKey]);

  // If not signed in and there's an error, show a friendly prompt instead of the error
  if (!userEmail && error) {
    return (
      <section className="bg-white/90 dark:bg-slate-950/88 border border-violet-100 dark:border-slate-800 rounded-2xl shadow-lg dark:shadow-black/25 overflow-hidden text-center py-10 px-7 transition-colors">
        <span className="text-violet-600 dark:text-violet-300 text-3xl" aria-hidden="true">♛</span>
        <h2 className="mt-3 text-xl font-bold text-indigo-950 dark:text-white">Leaderboard</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-300 text-sm leading-relaxed">
          Sign up or log in to see your score and compete on the leaderboard.
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

  if (loading)
    return (
      <p className="text-slate-500 dark:text-slate-300 text-center text-sm">
        Loading leaderboard...
      </p>
    );
  if (error)
    return (
      <p className="text-red-600 dark:text-red-300 text-center text-sm">{error}</p>
    );

  const rankColors = [
    "bg-amber-200 text-amber-800",   // 1st
    "bg-slate-200 text-slate-600",    // 2nd
    "bg-orange-200 text-orange-800",  // 3rd
  ];

  return (
    <section
      className="bg-white/90 dark:bg-slate-950/88 border border-violet-100 dark:border-slate-800 rounded-2xl shadow-lg dark:shadow-black/25 overflow-hidden transition-colors"
      aria-labelledby="leaderboard-title"
    >
      {/* Section heading */}
      <div className="flex items-start justify-between px-7 pt-6 pb-4">
        <div>
          <span className="text-violet-600 dark:text-violet-300 text-xs font-bold tracking-widest uppercase">
            TOP PERFORMERS
          </span>
          <h2
            id="leaderboard-title"
            className="m-0 text-2xl font-bold text-indigo-950 dark:text-white"
          >
            Leaderboard
          </h2>
        </div>
        <span className="text-violet-600 dark:text-violet-300 text-2xl" aria-hidden="true">
          ♛
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="px-7 pb-7 text-slate-500 dark:text-slate-300 text-sm">No scores yet.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="px-7 py-3 text-slate-500 dark:text-slate-400 bg-violet-50/80 dark:bg-slate-900 text-[0.69rem] tracking-wider font-bold">
                Rank
              </th>
              <th className="px-7 py-3 text-slate-500 dark:text-slate-400 bg-violet-50/80 dark:bg-slate-900 text-[0.69rem] tracking-wider font-bold">
                Player
              </th>
              <th className="px-7 py-3 text-slate-500 dark:text-slate-400 bg-violet-50/80 dark:bg-slate-900 text-[0.69rem] tracking-wider font-bold">
                Best Time
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.email}>
                <td className="px-7 py-3.5 border-t border-violet-100 dark:border-slate-800 text-sm">
                  <span
                    className={`w-6 h-6 grid place-items-center rounded-full text-xs font-bold ${i < 3 ? rankColors[i] : "bg-violet-50 dark:bg-slate-900 text-slate-500 dark:text-slate-300"
                      }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-7 py-3.5 border-t border-violet-100 dark:border-slate-800 text-sm text-indigo-950 dark:text-slate-100">
                  {e.email}
                </td>
                <td className="px-7 py-3.5 border-t border-violet-100 dark:border-slate-800 text-sm text-violet-600 dark:text-violet-300 font-bold tabular-nums">
                  {e.bestTime.toFixed(2)}s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
