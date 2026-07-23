import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

// Attaches/propagates x-request-id so a single id is traceable across all apps.
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction) {
    const id = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
    req.id = id;
    res.setHeader("x-request-id", id);
    next();
  }
}
