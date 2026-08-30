import { useEffect, useState } from "react";
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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <div
      className={`${theme === "dark" ? "dark" : ""} min-h-screen flex flex-col transition-colors duration-300`}
      style={{
        background:
          theme === "dark"
            ? "radial-gradient(circle at 94% 0%, rgba(124, 58, 237, 0.24) 0, transparent 28rem), #070a14"
            : "radial-gradient(circle at 94% 0%, #ede9fe 0, transparent 28rem), #f5f3ff",
      }}
    >
      <Navbar
        userEmail={user?.email}
        onLogout={logout}
        onOpenAuth={openAuth}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      />

      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-10 flex-1">
        <section className="text-center mb-6" aria-labelledby="page-title">
          <span className="text-violet-600 dark:text-violet-300 text-xs font-bold tracking-widest uppercase">
            FOCUS MODE
          </span>
          <h1
            id="page-title"
            className="mt-2 text-4xl md:text-5xl font-extrabold text-indigo-950 dark:text-white leading-tight tracking-tight"
          >
            Build speed, one key at a time.
          </h1>
          <p className="mt-3 text-slate-500 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
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
          className="fixed inset-0 bg-black/40 dark:bg-black/70 z-50 grid place-items-center p-5"
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
