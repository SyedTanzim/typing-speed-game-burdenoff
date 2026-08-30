type NavbarProps = {
  userEmail?: string | null;
  onLogout: () => void;
  onOpenAuth: (mode: "login" | "register") => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Navbar({
  userEmail,
  onLogout,
  onOpenAuth,
  theme,
  onToggleTheme,
}: NavbarProps) {
  return (
    <header className="h-18 max-w-5xl mx-auto px-4 md:px-8 flex items-center justify-between w-full">
      <a
        className="flex items-center gap-2.5 text-indigo-950 dark:text-white no-underline text-xl font-bold tracking-tight"
        href="/"
        aria-label="Typing Speed home"
      >
        <span
          className="w-9 h-9 rounded-xl grid place-items-center bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-200 text-xl"
          aria-hidden="true"
        >
          ⌨
        </span>
        <span>TypeSprint</span>
      </a>

      <nav className="flex items-center gap-1.5" aria-label="Primary">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={theme === "dark"}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="w-10 h-10 rounded-full border border-violet-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 text-violet-700 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors grid place-items-center text-base shadow-sm"
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>

        {userEmail ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-300 hidden sm:inline">
              {userEmail}
            </span>
            <button
              onClick={onLogout}
              className="text-violet-600 dark:text-violet-300 font-bold rounded-full px-3 py-2 hover:bg-violet-100 dark:hover:bg-violet-500/15 transition-colors text-sm border-0 bg-transparent"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <button
              className="text-violet-600 dark:text-violet-300 font-bold rounded-full px-3 py-2 hover:bg-violet-100 dark:hover:bg-violet-500/15 transition-colors text-sm border-0 bg-transparent"
              onClick={() => onOpenAuth("login")}
            >
              Login
            </button>
            <button
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-5 h-10 font-bold text-sm shadow-md hover:shadow-lg transition-all border-0"
              onClick={() => onOpenAuth("register")}
            >
              Sign Up
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
