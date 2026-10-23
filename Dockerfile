# App completa: panel Vue (PWA) + API Node + Postgres externo.
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

COPY frontend ./frontend
RUN cd frontend && npm run build

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

COPY backend ./backend

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV STATIC_DIR=/app/frontend/dist

COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
EXPOSE 8788
CMD ["npm", "run", "start"]
