import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { LEADERBOARD_QUERY } from "../api/queries";

type Entry = { email: string; bestTime: number };

export function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const client = getClient();
        const data: any = await client.request(LEADERBOARD_QUERY, { limit: 10 });
        setEntries(data.leaderboard);
      } catch (err) {
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="status-message">Loading leaderboard...</p>;
  if (error) return <p className="status-message error-message">{error}</p>;

  return (
    <section className="leaderboard surface-card" aria-labelledby="leaderboard-title">
      <div className="section-heading"><div><span className="eyebrow">TOP PERFORMERS</span><h2 id="leaderboard-title">Leaderboard</h2></div><span className="leaderboard-icon" aria-hidden="true">♛</span></div>
      {entries.length === 0 ? (
        <p>No scores yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Rank</th><th>Player</th><th>Best Time</th></tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.email}>
                <td><span className={`rank rank-${i + 1}`}>{i + 1}</span></td>
                <td>{e.email}</td>
                <td>{e.bestTime.toFixed(2)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
