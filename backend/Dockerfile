# Use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Expose port
EXPOSE 4000

# Start server with migrations
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/index.ts"]
