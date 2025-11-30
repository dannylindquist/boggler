FROM oven/bun:latest as base
WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile --production

# Expose the port your application listens on (if applicable)
EXPOSE 8000

# Command to run your application
CMD ["bun", "run", "api/main.ts"]
