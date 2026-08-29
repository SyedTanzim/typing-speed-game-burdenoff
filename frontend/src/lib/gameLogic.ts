/**
 * Pure, framework-free game logic for the typing challenge.
 * Kept separate from TypingGame.tsx so it can be unit tested directly,
 * without rendering React components or simulating timers/intervals.
 */

export const TOTAL_CHARS = 20;
export const PENALTY_SECONDS = 0.5;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Generates `count` random uppercase letters (A-Z). */
export function generateLetters(count: number = TOTAL_CHARS): string[] {
  return Array.from(
    { length: count },
    () => LETTERS[Math.floor(Math.random() * LETTERS.length)]
  );
}

/** Whether a raw keyboard `key` value represents a single A-Z letter. */
export function isValidLetterKey(key: string): boolean {
  const upper = key.toUpperCase();
  return upper.length === 1 && upper >= "A" && upper <= "Z";
}

export type KeyPressResult = {
  /** Whether the pressed key matched the expected letter. */
  isCorrect: boolean;
  /** The index to move to after this key press. */
  nextIndex: number;
  /** Whether this key press finished the sequence. */
  isComplete: boolean;
};

/**
 * Evaluates a single key press against the current position in the sequence.
 * On a correct key, the index advances; on an incorrect key, it stays put
 * (the caller tracks the resulting penalty separately).
 */
export function processKeyPress(
  sequence: string[],
  currentIndex: number,
  pressedKey: string
): KeyPressResult {
  const expected = sequence[currentIndex];
  const pressed = pressedKey.toUpperCase();
  const isCorrect = pressed === expected;
  const nextIndex = isCorrect ? currentIndex + 1 : currentIndex;

  return {
    isCorrect,
    nextIndex,
    isComplete: nextIndex >= sequence.length,
  };
}

/** Total penalty time accrued for a given number of wrong attempts. */
export function calculatePenalty(wrongAttempts: number): number {
  return wrongAttempts * PENALTY_SECONDS;
}

/**
 * Final score is the raw typing time plus any accrued penalty time,
 * rounded to 2 decimal places (matches how the UI displays it).
 */
export function calculateFinalTime(
  rawElapsedSeconds: number,
  penaltyTime: number
): number {
  return parseFloat((rawElapsedSeconds + penaltyTime).toFixed(2));
}

/**
 * A lower time is a better score. The first-ever completed game (no
 * previous best to compare against) is always treated as a new best.
 */
export function isNewBestScore(
  finalTime: number,
  previousBest: number | null
): boolean {
  return previousBest === null || finalTime < previousBest;
}

/** Builds the per-user (or guest) localStorage key used to persist best scores. */
export function getBestScoreStorageKey(userId: string | undefined | null): string {
  return userId ? `typing_game_best_score_${userId}` : "typing_game_best_score_guest";
}