import { describe, expect, test } from "bun:test";

// Self-contained core game calculation helpers
export function calculatePenaltyTime(wrongAttempts: number): number {
    return wrongAttempts * 0.5;
}

export function calculateTotalTime(baseTimeSeconds: number, wrongAttempts: number): number {
    const penalty = calculatePenaltyTime(wrongAttempts);
    return Math.round((baseTimeSeconds + penalty) * 100) / 100;
}

export function isNewHighScore(newTime: number, previousBestTime: number | null): boolean {
    if (previousBestTime === null || previousBestTime === undefined) return true;
    return newTime < previousBestTime;
}

export function sortLeaderboard<T extends { bestTime: number }>(entries: T[]): T[] {
    return [...entries].sort((a, b) => a.bestTime - b.bestTime);
}

// Unit Test Suite
describe("Typing Game Mechanics", () => {
    test("calculates 0.5s penalty per wrong key press", () => {
        expect(calculatePenaltyTime(0)).toBe(0);
        expect(calculatePenaltyTime(1)).toBe(0.5);
        expect(calculatePenaltyTime(4)).toBe(2.0);
    });

    test("calculates total score time accurately with penalties", () => {
        // 10.0s base + (3 wrong attempts * 0.5s) = 11.5s
        expect(calculateTotalTime(10.0, 3)).toBe(11.5);
        // 8.42s base + 0 wrong attempts = 8.42s
        expect(calculateTotalTime(8.42, 0)).toBe(8.42);
    });

    test("evaluates best scores correctly (lower completion time is better)", () => {
        expect(isNewHighScore(8.5, 9.2)).toBe(true);   // Faster time -> New High Score
        expect(isNewHighScore(10.1, 9.2)).toBe(false); // Slower time -> Keep Old High Score
        expect(isNewHighScore(9.2, 9.2)).toBe(false);  // Tie -> Keep Old High Score
        expect(isNewHighScore(7.5, null)).toBe(true);  // First game ever -> High Score
    });

    test("orders leaderboard entries in ascending order of best times", () => {
        const scores = [
            { username: "John", bestTime: 9.15 },
            { username: "Alex", bestTime: 8.42 },
            { username: "Sarah", bestTime: 9.87 },
        ];

        const sorted = sortLeaderboard(scores);

        expect(sorted[0]!.username).toBe("Alex");
        expect(sorted[0]!.bestTime).toBe(8.42);
        expect(sorted[1]!.username).toBe("John");
        expect(sorted[2]!.username).toBe("Sarah");
    });
});