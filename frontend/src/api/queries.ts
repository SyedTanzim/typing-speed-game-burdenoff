export const REGISTER_MUTATION = /* GraphQL */ `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
      user { id email }
    }
  }
`;

export const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id email }
    }
  }
`;

export const ME_QUERY = /* GraphQL */ `
  query Me {
    me { id email }
  }
`;

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

export const MY_BEST_SCORE_QUERY = /* GraphQL */ `
  query MyBestScore {
    myBestScore {
      timeSeconds
    }
  }
`;

export const LEADERBOARD_QUERY = /* GraphQL */ `
  query Leaderboard($limit: Int) {
    leaderboard(limit: $limit) {
      email
      bestTime
    }
  }
`;
