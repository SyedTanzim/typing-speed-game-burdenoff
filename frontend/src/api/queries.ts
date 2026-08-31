// Creates an account and requests the JWT plus public user fields needed by AuthContext.
export const REGISTER_MUTATION = /* GraphQL */ `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
      user { id email }
    }
  }
`;

// Verifies existing credentials and returns the same authentication payload shape.
export const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id email }
    }
  }
`;

// Uses the request JWT to retrieve the currently authenticated user.
export const ME_QUERY = /* GraphQL */ `
  query Me {
    me { id email }
  }
`;

// Persists one completed game for the user identified by the request JWT.
export const SAVE_GAME_RESULT_MUTATION = /* GraphQL */ `
  mutation SaveGameResult(
    $timeSeconds: Float!
    $correctChars: Int!
    $wrongAttempts: Int!
    $penaltyTime: Float!
  ) {
    saveGameResult(
      timeSeconds: $timeSeconds
      correctChars: $correctChars
      wrongAttempts: $wrongAttempts
      penaltyTime: $penaltyTime
    ) {
      id
      timeSeconds
    }
  }
`;

// Retrieves the signed-in user's result history, newest first on the backend.
export const MY_HISTORY_QUERY = /* GraphQL */ `
  query MyGameHistory {
    myGameHistory {
      id
      timeSeconds
      correctChars
      wrongAttempts
      penaltyTime
      createdAt
    }
  }
`;

// Requests only the lowest saved time needed by the game panel.
export const MY_BEST_SCORE_QUERY = /* GraphQL */ `
  query MyBestScore {
    myBestScore {
      timeSeconds
    }
  }
`;

// Requests the personal aggregates displayed by the statistics panel.
export const MY_GAME_STATS_QUERY = /* GraphQL */ `
  query MyGameStats {
    myGameStats {
      gamesPlayed
      bestTime
      averageTime
      averageWrongAttempts
      averagePenaltyTime
      lastPlayedAt
    }
  }
`;

// Requests a limited public ranking in which each user appears with their best time.
export const LEADERBOARD_QUERY = /* GraphQL */ `
  query Leaderboard($limit: Int) {
    leaderboard(limit: $limit) {
      email
      bestTime
    }
  }
`;
