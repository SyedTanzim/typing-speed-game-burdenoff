import { describe, test, expect } from "vitest";
import {
  TOTAL_CHARS,
  PENALTY_SECONDS,
  generateLetters,
  isValidLetterKey,
  processKeyPress,
  calculatePenalty,
  calculateFinalTime,
  isNewBestScore,
} from "./gameLogic";

describe("generateLetters", () => {
  test("generates the requested number of letters", () => {
    expect(generateLetters(20)).toHaveLength(20);
    expect(generateLetters(1)).toHaveLength(1);
  });

  test("defaults to TOTAL_CHARS (20) when no count is given", () => {
    expect(generateLetters()).toHaveLength(TOTAL_CHARS);
  });

  test("only produces single uppercase A-Z characters", () => {
    const letters = generateLetters(500);
    expect(letters.every((letter) => /^[A-Z]$/.test(letter))).toBe(true);
  });
});

describe("isValidLetterKey", () => {
  test("accepts single letters regardless of case", () => {
    expect(isValidLetterKey("a")).toBe(true);
    expect(isValidLetterKey("Z")).toBe(true);
  });

  test("rejects non-letter keys such as digits, punctuation, and control keys", () => {
    expect(isValidLetterKey("1")).toBe(false);
    expect(isValidLetterKey(" ")).toBe(false);
    expect(isValidLetterKey("Shift")).toBe(false);
    expect(isValidLetterKey("Enter")).toBe(false);
    expect(isValidLetterKey("")).toBe(false);
  });
});

describe("processKeyPress - correct character handling", () => {
  test("advances the index by one on a correct key press", () => {
    const result = processKeyPress(["A", "B", "C"], 0, "A");
    expect(result.isCorrect).toBe(true);
    expect(result.nextIndex).toBe(1);
    expect(result.isComplete).toBe(false);
  });

  test("matching is case-insensitive", () => {
    const result = processKeyPress(["A"], 0, "a");
    expect(result.isCorrect).toBe(true);
  });

  test("marks the round complete after the last correct character", () => {
    const result = processKeyPress(["A", "B"], 1, "B");
    expect(result.isCorrect).toBe(true);
    expect(result.nextIndex).toBe(2);
    expect(result.isComplete).toBe(true);
  });
});

describe("processKeyPress - incorrect character handling", () => {
  test("does not advance the index on a wrong key press", () => {
    const result = processKeyPress(["A", "B", "C"], 0, "X");
    expect(result.isCorrect).toBe(false);
    expect(result.nextIndex).toBe(0);
    expect(result.isComplete).toBe(false);
  });

  test("staying on the same index means the same key can be retried", () => {
    const wrong = processKeyPress(["A"], 0, "Z");
    const retry = processKeyPress(["A"], wrong.nextIndex, "A");
    expect(retry.isCorrect).toBe(true);
    expect(retry.nextIndex).toBe(1);
  });
});

describe("penalty calculation", () => {
  test("applies a 0.5s penalty per wrong attempt", () => {
    expect(calculatePenalty(0)).toBe(0);
    expect(calculatePenalty(1)).toBe(PENALTY_SECONDS);
    expect(calculatePenalty(4)).toBeCloseTo(2.0);
  });

  test("final time is raw elapsed time plus accrued penalty", () => {
    expect(calculateFinalTime(10, 0)).toBe(10);
    expect(calculateFinalTime(8, calculatePenalty(3))).toBeCloseTo(9.5);
  });

  test("final time is rounded to 2 decimal places, matching the UI display", () => {
    expect(calculateFinalTime(8.4567, 0)).toBe(8.46);
  });
});

describe("isNewBestScore - high-score calculation", () => {
  test("the first ever completed game is always a new best", () => {
    expect(isNewBestScore(12.34, null)).toBe(true);
  });

  test("a lower (faster) time counts as a new best", () => {
    expect(isNewBestScore(9.5, 10)).toBe(true);
  });

  test("a higher (slower) time is not a new best", () => {
    expect(isNewBestScore(11, 10)).toBe(false);
  });

  test("an equal time is not treated as an improvement", () => {
    expect(isNewBestScore(10, 10)).toBe(false);
  });
});

