type NavbarProps = {
  userEmail?: string | null;
  onLogout: () => void;
  onOpenAuth: (mode: "login" | "register") => void;
};

export function Navbar({ userEmail, onLogout, onOpenAuth }: NavbarProps) {
  return (
    <header className="h-18 max-w-5xl mx-auto px-4 md:px-8 flex items-center justify-between w-full">
      <a
        className="flex items-center gap-2.5 text-indigo-950 no-underline text-xl font-bold tracking-tight"
        href="/"
        aria-label="Typing Speed home"
      >
        <span
          className="w-9 h-9 rounded-xl grid place-items-center bg-violet-100 text-violet-800 text-xl"
          aria-hidden="true"
        >
          ⌨
        </span>
        <span>TypeSprint</span>
      </a>

      <nav className="flex items-center gap-1.5" aria-label="Primary">

        {userEmail ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:inline">
              {userEmail}
            </span>
            <button
              onClick={onLogout}
              className="text-violet-600 font-bold rounded-full px-3 py-2 hover:bg-violet-100 transition-colors text-sm border-0 bg-transparent"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <button
              className="text-violet-600 font-bold rounded-full px-3 py-2 hover:bg-violet-100 transition-colors text-sm border-0 bg-transparent"
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