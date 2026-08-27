import { useAuth } from "./context/AuthContext";
import { Auth } from "./components/Auth";
import { TypingGame } from "./components/TypingGame";
import { Leaderboard } from "./components/Leaderboard";

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-app-bar">
        <a className="brand" href="/" aria-label="Typing Speed home"><span className="brand-mark" aria-hidden="true">⌨</span><span>TypeSprint</span></a>
        {user && (
          <div className="account-area">
            <span className="account-email">{user.email}</span>
            <button
              onClick={logout}
              className="text-button"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="page-content">
        <section className="intro" aria-labelledby="page-title"><span className="eyebrow">FOCUS MODE</span><h1 id="page-title">Build speed, one key at a time.</h1><p>Type the displayed letters as quickly and accurately as you can.</p></section>
        <TypingGame />
        <Leaderboard />

        {!user && (
          <div>
            <p className="text-center text-sm text-gray-400 mb-3">
              Want to save your scores? Log in or register below.
            </p>
            <Auth />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
