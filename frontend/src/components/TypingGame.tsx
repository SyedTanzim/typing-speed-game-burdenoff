import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getClient } from "../api/graphqlClient";
import { MY_BEST_SCORE_QUERY, SAVE_GAME_RESULT_MUTATION } from "../api/queries";
import {
  TOTAL_CHARS,
  PENALTY_SECONDS,
  generateLetters,
  isValidLetterKey,
  processKeyPress,
  calculateFinalTime,
  isNewBestScore,
} from "../lib/gameLogic";

type GameState = "idle" | "playing" | "finished";

type TypingGameProps = {
  onResultSaved?: () => void;
};

export function TypingGame({ onResultSaved }: TypingGameProps) {
  const { token, user } = useAuth();
  const [sequence, setSequence] = useState<string[]>(() => generateLetters(TOTAL_CHARS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<GameState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [penaltyTime, setPenaltyTime] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [result, setResult] = useState<"success" | "failure" | null>(null);
  const [saving, setSaving] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const penaltyRef = useRef(0);
  const wrongRef = useRef(0);

  // The persisted best score comes from the database for authenticated users.
  useEffect(() => {
    let cancelled = false;

    const loadBestScore = async () => {
      if (!token) {
        setBestScore(null);
        return;
      }

      try {
        const client = getClient(token);
        const data = await client.request<{ myBestScore?: { timeSeconds: number } | null }>(
          MY_BEST_SCORE_QUERY
        );
        if (!cancelled) {
          setBestScore(data.myBestScore?.timeSeconds ?? null);
        }
      } catch (err) {
        console.error("Failed to fetch user best score:", err);
        if (!cancelled) setBestScore(null);
      }
    };

    loadBestScore();

    return () => {
      cancelled = true;
    };
  }, [user?.id, token]);

  const startGame = useCallback(() => {
    setSequence(generateLetters(TOTAL_CHARS));
    setCurrentIndex(0);
    setElapsed(0);
    setPenaltyTime(0);
    setWrongAttempts(0);
    setFinalTime(null);
    setResult(null);
    penaltyRef.current = 0;
    wrongRef.current = 0;
    startTimeRef.current = Date.now();
    setState("playing");
  }, []);

  // Timer tick
  useEffect(() => {
    if (state !== "playing") return;

    intervalRef.current = window.setInterval(() => {
      if (startTimeRef.current !== null) {
        const rawElapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsed(rawElapsed);
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  const finishGame = useCallback(async () => {
    if (startTimeRef.current === null) return;
    const rawElapsed = (Date.now() - startTimeRef.current) / 1000;
    const total = calculateFinalTime(rawElapsed, penaltyRef.current);

    setState("finished");
    setFinalTime(total);

    const isSuccess = isNewBestScore(total, bestScore);
    setResult(isSuccess ? "success" : "failure");

    if (token) {
      setSaving(true);
      try {
        const client = getClient(token);
        await client.request(SAVE_GAME_RESULT_MUTATION, {
          timeSeconds: total,
          correctChars: TOTAL_CHARS,
          wrongAttempts: wrongRef.current,
          penaltyTime: parseFloat(penaltyRef.current.toFixed(2)),
        });
        if (isSuccess) {
          setBestScore(total);
        }
        onResultSaved?.();
      } catch (err) {
        console.error("Failed to save game result:", err);
      } finally {
        setSaving(false);
      }
    } else if (isSuccess) {
      setBestScore(total);
    }
  }, [token, bestScore, onResultSaved]);

  // Keyboard event handler
  useEffect(() => {
    if (state !== "playing") return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      if (!isValidLetterKey(e.key)) return;

      const { isCorrect, nextIndex, isComplete } = processKeyPress(
        sequence,
        currentIndex,
        e.key
      );

      if (isCorrect) {
        setCurrentIndex(nextIndex);
        if (isComplete) finishGame();
      } else {
        wrongRef.current += 1;
        penaltyRef.current += PENALTY_SECONDS;
        setWrongAttempts(wrongRef.current);
        setPenaltyTime(penaltyRef.current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, currentIndex, sequence, finishGame]);

  const displayTime = state === "finished" && finalTime !== null
    ? finalTime
    : elapsed + penaltyTime;

  return (
    <section
      className="bg-white/90 dark:bg-slate-950/88 border border-violet-100 dark:border-slate-800 rounded-2xl shadow-lg dark:shadow-black/25 p-5 text-center min-h-[380px] flex flex-col transition-colors"
      aria-labelledby="game-title"
    >
      {/* Card heading */}
      <div className="flex items-start justify-between text-left">
        <div>
          <span className="text-violet-600 dark:text-violet-300 text-xs font-bold tracking-widest uppercase">
            QUICK CHALLENGE
          </span>
          <h2 id="game-title" className="m-0 text-2xl font-bold text-indigo-950 dark:text-white">
            Typing sprint
          </h2>
        </div>
        <span className="bg-violet-50 dark:bg-violet-500/15 text-slate-500 dark:text-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5">
          20 letters
        </span>
      </div>

      {/* Best score - Top position (Playing/Finished) */}
      {bestScore !== null && state !== "idle" && (
        <p className="text-slate-500 dark:text-slate-300 text-sm mt-3 mb-1 shrink-0 text-left">
          Your best <strong className="text-violet-600 dark:text-violet-300 ml-1">{bestScore.toFixed(2)}s</strong>
        </p>
      )}

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Idle state */}
        {state === "idle" && (
          <div className="flex flex-col items-center">
            {bestScore !== null ? (
              <p className="text-slate-500 dark:text-slate-300 text-sm mb-4 mt-0">
                Your best <strong className="text-violet-600 dark:text-violet-300 ml-1">{bestScore.toFixed(2)}s</strong>
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-4 mt-0">
                No best time recorded yet
              </p>
            )}
            <button
              onClick={startGame}
              className="border-0 rounded-full bg-violet-600 hover:bg-violet-700 text-white h-11 px-6 font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:translate-y-px"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Playing state */}
        {state === "playing" && (
          <div className="w-full mt-1">
            <div className="grid grid-cols-2 text-left gap-3">
              <div className="bg-violet-50/80 dark:bg-slate-900 rounded-xl p-2.5 px-3">
                <span className="block text-slate-500 dark:text-slate-400 text-[0.67rem] font-bold tracking-widest">
                  TIME
                </span>
                <strong className="block mt-1 text-lg tabular-nums text-indigo-950 dark:text-white">
                  {displayTime.toFixed(2)}s
                </strong>
              </div>
              <div className="bg-violet-50/80 dark:bg-slate-900 rounded-xl p-2.5 px-3">
                <span className="block text-slate-500 dark:text-slate-400 text-[0.67rem] font-bold tracking-widest">
                  PROGRESS
                </span>
                <strong className="block mt-1 text-lg tabular-nums text-indigo-950 dark:text-white">
                  {currentIndex} / {TOTAL_CHARS}
                </strong>
              </div>
            </div>

            <div
              className="h-1.5 bg-violet-100 dark:bg-slate-800 rounded-full overflow-hidden my-3"
              aria-label={`${currentIndex} of ${TOTAL_CHARS} letters completed`}
            >
              <span
                className="block h-full bg-violet-600 dark:bg-violet-400 rounded-full transition-all duration-150"
                style={{ width: `${(currentIndex / TOTAL_CHARS) * 100}%` }}
              />
            </div>

            <p className="text-slate-500 dark:text-slate-300 text-sm">Press the key shown below</p>

            <div
              className="w-28 h-28 mx-auto my-3 grid place-items-center bg-violet-100 dark:bg-violet-400/15 text-violet-900 dark:text-violet-100 rounded-3xl text-6xl font-bold leading-none shadow-[inset_0_0_0_1px_rgba(109,40,217,0.08)] dark:shadow-[inset_0_0_0_1px_rgba(167,139,250,0.25)]"
              aria-live="polite"
            >
              {sequence[currentIndex]}
            </div>

            {wrongAttempts > 0 && (
              <p className="text-red-600 dark:text-red-300 text-sm font-semibold">
                Penalties: {wrongAttempts} (+{penaltyTime.toFixed(1)}s)
              </p>
            )}
          </div>
        )}

        {/* Finished state */}
        {state === "finished" && (
          <div className="grid justify-items-center gap-2.5">
            <div
              className={`w-13 h-13 rounded-2xl grid place-items-center text-2xl font-bold ${
                result === "success"
                  ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300"
              }`}
              aria-hidden="true"
            >
              {result === "success" ? "✓" : "↻"}
            </div>
            <p className="text-4xl font-bold tabular-nums text-indigo-950 dark:text-white m-0">
              {finalTime?.toFixed(2)}s
            </p>
            <p className="text-lg font-bold text-indigo-950 dark:text-white m-0">
              {result === "success" ? "Success!" : "Failure — Try Again"}
            </p>
            <p className="text-slate-500 dark:text-slate-300 text-sm m-0">
              Correct: {TOTAL_CHARS} | Wrong: {wrongAttempts} | Penalty: {penaltyTime.toFixed(1)}s
            </p>
            {saving && (
              <p className="text-slate-500 dark:text-slate-300 text-sm m-0">Saving result...</p>
            )}
            <button
              onClick={startGame}
              className="mt-3.5 border-0 rounded-full bg-violet-600 hover:bg-violet-700 text-white h-11 px-6 font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:translate-y-px"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
