# TypeSprint — Typing Speed Game

A full-stack typing speed game. Type 20 randomly generated letters as fast as
you can, beat your best time, and climb the leaderboard.

**Live demo:** https://typing-speed-game-burdenoff.vercel.app/

**Backend API:** https://typing-speed-game-burdenoff-production.up.railway.app/graphql

## Features

- Timed 20-letter typing challenge with live progress tracking
- 0.5s penalty per incorrect keystroke, added live to the running timer
- Guest play without persisted browser-side best-score storage
- Account system to save results server-side and appear on the leaderboard
- Global leaderboard ranked by best time (ascending — lower is better)
- Personal game history per account
- Personal statistics and analytics per account

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | React, TypeScript, Vite, Tailwind CSS       |
| Backend    | Bun, TypeScript, GraphQL Yoga               |
| Database   | PostgreSQL, Prisma ORM                      |
| Auth       | JWT, bcrypt password hashing                |
| Local infra| Docker Compose (Postgres)                   |

## Project Structure

typing-speed-game-burdenoff/
├── backend/ # Bun + GraphQL Yoga + Prisma API
├── frontend/ # React + Vite + Tailwind client
└── docker-compose.yml


## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- [Node.js](https://nodejs.org) (for the frontend)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) running

### 1. Start the database

From the project root:

```bash
docker compose up -d
```

This starts a PostgreSQL container on `localhost:5433` (mapped from the
container's internal `5432`, to avoid clashing with any local Postgres
install).

### 2. Backend setup

```bash
cd backend
bun install
cp .env.example .env
```

Edit `.env` and set a real `JWT_SECRET` (any long random string). The
`DATABASE_URL` default already matches the Docker Compose setup above.

Run the database migration:

```bash
bunx prisma migrate dev
```

Start the API:

```bash
bun run dev
```

The GraphQL API and playground are now available at
`http://localhost:4000/graphql`.

### 3. Frontend setup

In a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

**backend/.env.example**

DATABASE_URL="postgresql://typing_user:typing_pass@localhost:5433/typing_speed_game"
JWT_SECRET="replace-with-a-long-random-string"
FRONTEND_URL="http://localhost:5173"
PORT=4000


**frontend/.env.example**

VITE_API_URL="http://localhost:4000/graphql"


## GraphQL API

| Operation             | Type     | Auth required  | Description                           |
|---------------------- |----------|:--------------:|---------------------------------------|
| `register`            | Mutation | No             | Create an account, returns a JWT      |
| `login`               | Mutation | No             | Authenticate, returns a JWT           |
| `me`                  | Query    | Yes            | Current authenticated user            |
| `saveGameResult`      | Mutation | Yes            | Save a completed game's result        |
| `myGameHistory`       | Query    | Yes            | The authenticated user's past results |
| `myBestScore`         | Query    | Yes            | The authenticated user's best time    |
| `myGameStats`         | Query    | Yes            | The authenticated user's game stats   |
| `leaderboard(limit)`  | Query    | No             | Top best times across all users       |

A user can only ever read or write their own game data — history and best
score are always scoped to the authenticated user via the JWT in the
`Authorization` header, never by a client-supplied user ID.

## Game Rules

- 20 randomly generated uppercase letters, shown one at a time
- The timer starts as soon as the first key is pressed
- Pressing the correct letter advances to the next one
- Pressing an incorrect letter adds a fixed 0.5s penalty to the total time and
  does **not** advance the sequence
- Final score = raw elapsed time + total penalty time
- A **lower** final score is a **better** score
- Your personal best is compared against your final score; beating it shows
  "Success," otherwise "Failure — Try Again"
- Best score is derived from authenticated database results; guest play is
  session-only and does not trust browser storage for a persisted best

## Key Technical Decisions

- **Guest play by default.** The game is fully playable without an account —
  authentication gates persisted best scores, server-side history, and the leaderboard. This
  matches the assignment's emphasis on the core game loop while still meeting
  every auth requirement.
- **JWT in localStorage, not httpOnly cookies.** Simpler to implement correctly
  under time constraints, and acceptable for this project's scope. A
  production app handling sensitive data would use httpOnly cookies to reduce
  XSS exposure.
- **Leaderboard computed on read, not cached.** Best time per user is derived
  from all of that user's `GameResult` rows at query time rather than stored
  as a separate denormalized field. Simpler data model, fewer places for
  best-score bugs to hide, and the dataset size here doesn't warrant caching.
- **Separate ports for local Postgres.** The Docker container maps to
  `5433` instead of the default `5432` to avoid collisions with any Postgres
  already installed on the host machine.
- **No routing library.** The whole app is a single page; auth is handled as
  a modal overlay rather than separate routes, since introducing a router for
  two logical "pages" added complexity the scope didn't need.

## Running Tests

The backend includes an automated test suite covering game penalty calculations, high-score rules, leaderboard sorting, and password hashing utilities.

```bash
cd backend
bun test
```

## Deployment

- **Frontend:** Deployed on Vercel, auto-builds from the `frontend/` directory.
- **Backend + Database:** Deployed on Railway. Postgres runs as a managed
  Railway plugin; the backend service runs `bunx prisma migrate deploy` on
  each build to keep the schema in sync.

## Author

Syed Tanzim Wajih
