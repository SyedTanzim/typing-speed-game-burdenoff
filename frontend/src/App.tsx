import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Auth } from "./components/Auth";
import { TypingGame } from "./components/TypingGame";
import { Leaderboard } from "./components/Leaderboard";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

function App() {
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <div
      className="min-h-screen bg-violet-50 flex flex-col"
      style={{
        background:
          "radial-gradient(circle at 94% 0%, #ede9fe 0, transparent 28rem), #f5f3ff",
      }}
    >
      <Navbar userEmail={user?.email} onLogout={logout} onOpenAuth={openAuth} />

      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-10 flex-1">
        <section className="text-center mb-6" aria-labelledby="page-title">
          <span className="text-violet-600 text-xs font-bold tracking-widest uppercase">
            FOCUS MODE
          </span>
          <h1
            id="page-title"
            className="mt-2 text-4xl md:text-5xl font-extrabold text-indigo-950 leading-tight tracking-tight"
          >
            Build speed, one key at a time.
          </h1>
          <p className="mt-3 text-slate-500 max-w-md mx-auto leading-relaxed">
            Type the displayed letters as quickly and accurately as you can.
          </p>
        </section>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full">
          {/* Spacer to balance the layout and perfectly center the game card */}
          <div className="hidden lg:block flex-1 max-w-[340px]"></div>

          <div className="w-full max-w-xl mx-auto lg:mx-0 shrink-0">
            <TypingGame
              onResultSaved={() => setLeaderboardRefreshKey((key) => key + 1)}
            />
          </div>

          <div className="w-full max-w-xl mx-auto lg:mx-0 lg:flex-1 lg:max-w-[340px]">
            <Leaderboard
              userEmail={user?.email}
              onOpenAuth={openAuth}
              refreshKey={leaderboardRefreshKey}
            />
          </div>
        </div>
      </main>

      <Footer />

      {authOpen && !user && (
        <div
          className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-5"
          onClick={() => setAuthOpen(false)}
        >
          <div
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Auth
              initialMode={authMode}
              onClose={() => setAuthOpen(false)}
              onSuccess={() => setAuthOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
