# Feasibility Checker — Railway/any-Docker-host image.
# Build context is the repo root (Railway default); only the app dir is copied,
# so the image skips the monorepo's 299 dev dependencies entirely.
FROM oven/bun:1-slim

WORKDIR /app
COPY feasibility-checker/ ./feasibility-checker/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "feasibility-checker/server.ts"]
