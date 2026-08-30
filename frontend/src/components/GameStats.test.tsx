import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import { GameStats } from "./GameStats";

const requestMock = vi.hoisted(() => vi.fn());

vi.mock("../api/graphqlClient", () => ({
  API_ENDPOINT: "http://localhost:4000/graphql",
  getClient: vi.fn(() => ({ request: requestMock })),
}));

function renderStats() {
  return render(
    <AuthProvider>
      <GameStats onOpenAuth={vi.fn()} />
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  requestMock.mockReset();
});

describe("GameStats", () => {
  test("prompts guests to log in or sign up", () => {
    renderStats();

    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("Sign up or log in to track your typing trends.")).toBeInTheDocument();
    expect(requestMock).not.toHaveBeenCalled();
  });

  test("renders authenticated analytics from the API", async () => {
    localStorage.setItem("token", "token-1");
    localStorage.setItem("user", JSON.stringify({ id: "user-1", email: "a@example.com" }));
    requestMock.mockResolvedValue({
      myGameStats: {
        gamesPlayed: 4,
        bestTime: 8.5,
        averageTime: 10.25,
        averageWrongAttempts: 1.5,
        averagePenaltyTime: 0.75,
        lastPlayedAt: "2026-08-30T08:00:00.000Z",
      },
    });

    renderStats();

    expect(await screen.findByText("4")).toBeInTheDocument();
    expect(screen.getByText("8.50s")).toBeInTheDocument();
    expect(screen.getByText("10.25s")).toBeInTheDocument();
    expect(screen.getByText("1.50")).toBeInTheDocument();
    expect(screen.getByText("0.75s")).toBeInTheDocument();
  });
});
