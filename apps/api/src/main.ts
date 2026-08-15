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
    .setDescription("Migrated LOOM Backend - Complete E-commerce & Content Management System. This API provides comprehensive endpoints for authentication, commerce operations, content management, and more.")
    .setVersion("2.0.0")
    .setContact("Anuprerna Team", "https://anuprerna.com", "support@anuprerna.com")
    .setLicense("Proprietary", "https://anuprerna.com")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token for authentication. Use the /auth/login endpoint to obtain a token.",
      },
      "bearer",
    )
    // Tag definitions with descriptions for organization
    .addTag("Health", "API health and status checks")
    .addTag("Authentication", "User login, registration, and auth token management")
    .addTag("Cart", "Shopping cart operations and management")
    .addTag("Product", "Product catalog and details")
    .addTag("Inventory", "Inventory and stock management")
    .addTag("Order", "Order processing and management")
    .addTag("Payment", "Payment gateway integration")
    .addTag("User", "User profile and account management")
    .addTag("Content", "Blog posts, stories, and content management")
    .addTag("Search", "Search and filtering operations")
    .addTag("Admin", "Administrative operations (protected)")
    .build();

  // Swagger UI is on unless SWAGGER=false.
  const enableSwagger = appConfig.get("SWAGGER", { infer: true }) !== "false";

  if (enableSwagger) {
    const document = SwaggerModule.createDocument(app, config);
    
    // Setup multiple Swagger UI endpoints
    SwaggerModule.setup("docs", app, document, { 
      jsonDocumentUrl: "docs-json",
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
        filter: true,
        showRequestHeaders: true,
        defaultModelsExpandDepth: 1,
        docExpansion: "list",
      }
    });
    SwaggerModule.setup("swagger", app, document, { jsonDocumentUrl: "swagger-json" });
    SwaggerModule.setup("api-docs", app, document, { jsonDocumentUrl: "api-docs-json" });
  }

  await app.listen(appConfig.get("PORT", { infer: true }) ?? 3000);

  const url = await app.getUrl();
  console.log("🚀 Server running at:", url);
  if (enableSwagger) {
    console.log("\n📖 API Documentation:");
    console.log(`   🔵 Swagger UI (Primary): ${url}/docs`);
    console.log(`   🔵 Swagger UI (Alt 1):   ${url}/swagger`);
    console.log(`   🔵 Swagger UI (Alt 2):   ${url}/api-docs`);
    console.log(`   📄 OpenAPI JSON:         ${url}/docs-json`);
    console.log(`\n💡 To generate share links, run: node scripts/export-swagger.mjs --host=localhost:3000\n`);
  }
}

bootstrap();
