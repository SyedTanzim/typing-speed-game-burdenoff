import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINT } from "../api/graphqlClient";

type AuthProps = {
  initialMode?: "login" | "register";
  onClose?: () => void;
  onSuccess?: () => void;
};

function getAuthErrorMessage(err: unknown) {
  const graphQLError = (err as any)?.response?.errors?.[0]?.message;
  if (graphQLError) return graphQLError;

  const message = err instanceof Error ? err.message : "";
  if (message.toLowerCase().includes("failed to fetch")) {
    return `Could not reach the API at ${API_ENDPOINT}. Check VITE_API_URL on Vercel and CORS FRONTEND_URLS on Railway.`;
  }

  return message || "Something went wrong";
}

export function Auth({ initialMode = "login", onClose, onSuccess }: AuthProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative bg-white rounded-2xl shadow-xl p-7 text-center max-w-md mx-auto border border-violet-100">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full border-0 bg-violet-50 text-slate-500 text-base leading-none grid place-items-center hover:bg-violet-100 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      )}
      <span className="text-violet-600 text-xs font-bold tracking-widest uppercase">
        SAVE YOUR PROGRESS
      </span>
      <h2 className="mt-1 text-xl font-bold text-indigo-950">
        {mode === "login" ? "Login" : "Register"}
      </h2>
      <form onSubmit={handleSubmit} className="grid gap-3.5 mt-5">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-13 px-4 border border-slate-300 rounded-lg text-indigo-950 bg-transparent outline-none placeholder:text-slate-400 focus:border-2 focus:border-violet-600 focus:px-[15px] transition-colors"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full h-13 px-4 border border-slate-300 rounded-lg text-indigo-950 bg-transparent outline-none placeholder:text-slate-400 focus:border-2 focus:border-violet-600 focus:px-[15px] transition-colors"
        />
        {error && <p className="text-red-600 text-sm m-0">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="border-0 rounded-full bg-violet-600 hover:bg-violet-700 text-white h-11 px-6 font-bold tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-55 disabled:cursor-wait"
        >
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-3 border-0 bg-transparent text-violet-600 px-3 py-2 font-bold rounded-full text-sm hover:bg-violet-50 transition-colors"
      >
        {mode === "login"
          ? "Need an account? Register"
          : "Already have an account? Login"}
      </button>
    </section>
  );
}
