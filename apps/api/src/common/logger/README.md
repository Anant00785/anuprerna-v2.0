# logger

Structured logging (pino) + request-id. One id traceable across storefront -> api -> worker.
dev: wire `nestjs-pino` in `main.ts` and add a request-id middleware in `../middleware`.
