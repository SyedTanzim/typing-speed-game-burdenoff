import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getClient } from "../api/graphqlClient";
import { SAVE_GAME_RESULT_MUTATION } from "../api/queries";

const TOTAL_CHARS = 20;
const PENALTY_SECONDS = 0.5;
const BEST_SCORE_KEY = "typing_game_best_score";

function generateLetters(count: number): string[] {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: count }, () =>
    letters[Math.floor(Math.random() * letters.length)]
  );
}

type GameState = "idle" | "playing" | "finished";

export function TypingGame() {
  const { token } = useAuth();
  const [sequence, setSequence] = useState<string[]>(() => generateLetters(TOTAL_CHARS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<GameState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [penaltyTime, setPenaltyTime] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [result, setResult] = useState<"success" | "failure" | null>(null);
  const [saving, setSaving] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const penaltyRef = useRef(0); // avoids stale closure issues in keydown handler
  const wrongRef = useRef(0);

  const bestScore = (() => {
    const stored = localStorage.getItem(BEST_SCORE_KEY);
    return stored ? parseFloat(stored) : null;
  })();

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
    const total = rawElapsed + penaltyRef.current;

    setState("finished");
    setFinalTime(total);

    const isSuccess = bestScore === null || total < bestScore;
    setResult(isSuccess ? "success" : "failure");

    if (isSuccess) {
      localStorage.setItem(BEST_SCORE_KEY, total.toFixed(2));
    }

    if (token) {
      setSaving(true);
      try {
        const client = getClient(token);
        await client.request(SAVE_GAME_RESULT_MUTATION, {
          timeSeconds: parseFloat(total.toFixed(2)),
          correctChars: TOTAL_CHARS,
          wrongAttempts: wrongRef.current,
          penaltyTime: parseFloat(penaltyRef.current.toFixed(2)),
        });
      } catch (err) {
        console.error("Failed to save game result:", err);
      } finally {
        setSaving(false);
      }
    }
  }, [token, bestScore]);

  // Keyboard handling
  useEffect(() => {
    if (state !== "playing") return;

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toUpperCase();
      if (key.length !== 1 || key < "A" || key > "Z") return;

      const expected = sequence[currentIndex];

      if (key === expected) {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= TOTAL_CHARS) {
          setCurrentIndex(nextIndex);
          finishGame();
        } else {
          setCurrentIndex(nextIndex);
        }
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
    <div className="game-container">
      <h2>Typing Speed Game</h2>

      {bestScore !== null && (
        <p className="best-score">Best: {bestScore.toFixed(2)}s</p>
      )}

      {state === "idle" && (
        <button onClick={startGame} className="start-button">
          Start Game
        </button>
      )}

      {state === "playing" && (
        <div className="game-active">
          <p className="timer">{displayTime.toFixed(2)}s</p>
          <p className="progress">{currentIndex} / {TOTAL_CHARS}</p>
          <div className="current-letter">{sequence[currentIndex]}</div>
          {wrongAttempts > 0 && (
            <p className="penalty-note">
              Penalties: {wrongAttempts} (+{penaltyTime.toFixed(1)}s)
            </p>
          )}
        </div>
      )}

      {state === "finished" && (
        <div className="game-result">
          <p className="final-time">{finalTime?.toFixed(2)}s</p>
          <p className={result === "success" ? "success-text" : "failure-text"}>
            {result === "success" ? "Success!" : "Failure — Try Again"}
          </p>
          <p>Correct: {TOTAL_CHARS} | Wrong: {wrongAttempts} | Penalty: {penaltyTime.toFixed(1)}s</p>
          {saving && <p>Saving result...</p>}
          <button onClick={startGame} className="start-button">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}