import { describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TypingGame } from "./TypingGame";
import { AuthProvider } from "../context/AuthContext";
import { getBestScoreStorageKey } from "../lib/gameLogic";

// Wrapped in AuthProvider since TypingGame reads the auth token via useAuth().
// No user is logged in during these tests (localStorage starts empty), so
// the component never attempts a network call to save the result — only
// local, client-side game behavior is exercised here.
function renderGame() {
  return render(
    <AuthProvider>
      <TypingGame />
    </AuthProvider>
  );
}

/** Reads the single large letter currently shown on the game screen. */
function getCurrentLetter(): string {
  return screen.getByText(/^[A-Z]$/).textContent as string;
}

/** Returns a letter guaranteed not to match the one currently displayed. */
function anyWrongLetterFor(correct: string): string {
  return correct === "A" ? "B" : "A";
}

const GUEST_KEY = getBestScoreStorageKey(null);

beforeEach(() => {
  localStorage.clear();
});

describe("game start and idle state", () => {
  test("shows a Start Game button before playing", () => {
    renderGame();
    expect(screen.getByText("Start Game")).toBeInTheDocument();
  });

  test("shows no best time recorded yet on a fresh browser", () => {
    renderGame();
    expect(screen.getByText("No best time recorded yet")).toBeInTheDocument();
  });

  test("starting the game shows progress at 0 / 20", () => {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));
    expect(screen.getByText("0 / 20")).toBeInTheDocument();
  });
});

describe("correct character handling", () => {
  test("pressing the correct key advances the progress counter", () => {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));

    const letter = getCurrentLetter();
    fireEvent.keyDown(window, { key: letter });

    expect(screen.getByText("1 / 20")).toBeInTheDocument();
  });

  test("repeated key events (held key) do not double-advance", () => {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));

    const letter = getCurrentLetter();
    fireEvent.keyDown(window, { key: letter, repeat: true });

    // A held/repeated key should be ignored entirely (e.repeat === true).
    expect(screen.getByText("0 / 20")).toBeInTheDocument();
  });
});

describe("incorrect character and penalty calculation", () => {
  test("a wrong key press counts an attempt and adds a 0.5s penalty, without advancing", () => {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));

    const correct = getCurrentLetter();
    const wrong = anyWrongLetterFor(correct);

    fireEvent.keyDown(window, { key: wrong });

    expect(screen.getByText(/Penalties: 1 \(\+0\.5s\)/)).toBeInTheDocument();
    expect(screen.getByText("0 / 20")).toBeInTheDocument();

    // The correct key still works afterwards.
    fireEvent.keyDown(window, { key: correct });
    expect(screen.getByText("1 / 20")).toBeInTheDocument();
  });

  test("multiple wrong presses accumulate penalty time", () => {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));

    const correct = getCurrentLetter();
    const wrong = anyWrongLetterFor(correct);

    fireEvent.keyDown(window, { key: wrong });
    fireEvent.keyDown(window, { key: wrong });

    expect(screen.getByText(/Penalties: 2 \(\+1\.0s\)/)).toBeInTheDocument();
  });

  test("non-letter keys are ignored entirely", () => {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));

    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(screen.getByText("0 / 20")).toBeInTheDocument();
    expect(screen.queryByText(/Penalties/)).not.toBeInTheDocument();
  });
});

describe("game completion", () => {
  function completeGame() {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));
    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(window, { key: getCurrentLetter() });
    }
  }

  test("finishes after 20 correct characters and shows a result", () => {
    completeGame();
    expect(screen.getByText(/Success!|Failure — Try Again/)).toBeInTheDocument();
    expect(
      screen.getByText("Correct: 20 | Wrong: 0 | Penalty: 0.0s")
    ).toBeInTheDocument();
  });

  test("shows a Play Again button once finished", () => {
    completeGame();
    expect(screen.getByText("Play Again")).toBeInTheDocument();
  });

  test("does not attempt to save a result when no one is logged in", () => {
    completeGame();
    // "Saving result..." would only appear if a token existed and a save
    // was in flight; as a guest, it should never show up.
    expect(screen.queryByText("Saving result...")).not.toBeInTheDocument();
  });
});

describe("high-score calculation", () => {
  test("the first completed game is always shown as a Success and stored as best", async () => {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));
    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(window, { key: getCurrentLetter() });
    }

    expect(screen.getByText("Success!")).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem(GUEST_KEY)).not.toBeNull();
    });
  });

  test("a manually seeded, unbeatable best score results in Failure — Try Again", async () => {
    // Seed an unbeatable best score (0.01s) before the game is even rendered.
    localStorage.setItem(GUEST_KEY, "0.01");

    renderGame();
    // bestScore loads asynchronously (a useEffect reads localStorage), so
    // wait for it to actually be reflected in the UI before starting —
    // otherwise the game could start before bestScore state updates.
    await screen.findByText("0.01s");

    fireEvent.click(screen.getByText("Start Game"));
    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(window, { key: getCurrentLetter() });
    }

    expect(screen.getByText("Failure — Try Again")).toBeInTheDocument();
    // The stored best score should be unchanged since it wasn't beaten.
    expect(localStorage.getItem(GUEST_KEY)).toBe("0.01");
  });

  test("restarting via Play Again resets progress for a new round", () => {
    renderGame();
    fireEvent.click(screen.getByText("Start Game"));
    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(window, { key: getCurrentLetter() });
    }

    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText("0 / 20")).toBeInTheDocument();
  });
});
