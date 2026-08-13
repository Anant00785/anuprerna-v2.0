/**
 * apps/api/src/main.ts
 *
 * Application bootstrap + Swagger/OpenAPI setup. This file did not exist
 * in the uploaded sources — if you already have a main.ts with other
 * bootstrap logic (CORS, global pipes, etc.), merge the DocumentBuilder/
 * SwaggerModule block below into it rather than overwriting.
 *
 * @nestjs/swagger only, as requested — no additional Swagger-adjacent
 * packages. Bearer JWT auth is enabled via addBearerAuth() so
 * @ApiBearerAuth() on protected controller routes renders an "Authorize"
 * lock icon in the UI. Tags are pre-registered via addTag(...) so all
 * three groups (Health, Authentication, Cart) appear in a stable order
 * even before/regardless of which controllers are scanned.
 */
import "dotenv/config";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module.js";
import type { EnvironmentVariables } from "./common/config/env.schema.js";

// Drizzle maps PostgreSQL bigint columns to JavaScript bigint values. Express
// serializes controller responses through JSON.stringify, so normalize them at
// the application boundary rather than duplicating conversion in repositories.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(ConfigService<EnvironmentVariables, true>);

  // CORS from origin/docs/core-commerce-planning: the CMS and storefront call
  // this API directly in local development. Not a real conflict with the
  // ConfigService line above - both are needed, git just saw adjacent edits.
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  const logger = new Logger("HTTP");
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    whitelist: true,
    forbidUnknownValues: true,
  }));
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    response.on("finish", () => {
      logger.log(`${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
  });

  const config = new DocumentBuilder()
    .setTitle("Anuprerna API")
    .setDescription("Migrated LOOM Backend")
    .setVersion("2.0")
    .addBearerAuth()
    .addTag("Health")
    .addTag("Authentication")
    .addTag("Cart")
    .addTag("Product")
    .build();

  // Enable Swagger by default in non-production environments.
  // In production set `SWAGGER=true` to explicitly enable it.
  const enableSwagger = appConfig.get("NODE_ENV", { infer: true }) !== "production" || appConfig.get("SWAGGER", { infer: true }) === "true";

  if (enableSwagger) {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document, { jsonDocumentUrl: "docs-json" });
    SwaggerModule.setup("swagger", app, document, { jsonDocumentUrl: "docs-json" });
  }

  await app.listen(appConfig.get("PORT", { infer: true }) ?? 3000);

  const url = await app.getUrl();
  console.log("🚀 Server running at:", url);
  if (enableSwagger) console.log("📖 Swagger UI:", `${url}/docs`);
}

bootstrap();
