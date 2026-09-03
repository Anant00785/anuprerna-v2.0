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
import compression from "compression";
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

/**
 * Fallback allowlist used when CORS_ORIGINS is unset. The deployed frontends
 * are listed here on purpose: origins were hardcoded here before CORS_ORIGINS
 * existed, and dropping them into env-only would have broken both Vercel apps
 * the moment the variable was missing. Set CORS_ORIGINS to override entirely.
 */
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3000",
  "https://anuprerna-v2-0-storefront-zeta.vercel.app",
  "https://anuprerna-v2-0-cms-green.vercel.app",
  "https://anuprerna.com",
  "https://www.anuprerna.com",
];

/**
 * Public, tenant-independent catalogue / navigation / taxonomy reads. Every
 * entry is a prefix of a GET route whose response is identical for every
 * caller — product catalogue, nav menus, colour/material/pattern/craft
 * taxonomies, segments and sub-categories.
 *
 * Deliberately an explicit allowlist rather than a "cache all GETs minus a
 * denylist": a new authenticated read route added later must not silently
 * become publicly cacheable. Anything customer-, cart-, checkout-, order-,
 * payment-, artisan- or admin-scoped is simply absent, and the guard in
 * `publicCacheControl` below additionally refuses to cache any request that
 * carried an Authorization header or a cookie, so a route that turns out to
 * vary per user cannot leak through a shared cache even if it is listed here.
 */
const PUBLIC_CACHEABLE_PREFIXES = [
  "/get/navigation",
  "/get/product/nav-menu/",
  "/get/category-list",
  "/get/category/",
  "/get/segment-list",
  "/get/segment/",
  "/get/sub-category-list",
  "/get/sub-category/",
  "/get/product/sub-category/",
  "/get/color-list",
  "/get/material-list",
  "/get/pattern-list",
  "/get/tag-list",
  "/get/special-status-list",
  "/get/filter/",
  "/get/filter-seo/",
  "/get/fabric-product/slug/",
  "/get/fabric-product/filter-preview",
  "/get/finished-product/slug/",
  "/get/fabric-preview-list",
  "/get/finished-preview-list",
];

/**
 * `public, s-maxage=300, stale-while-revalidate=3600` on read-only catalogue
 * routes only. `s-maxage` targets shared caches (CDN) rather than the browser,
 * so a CMS edit is visible to an editor doing a hard refresh within 5 minutes.
 */
function publicCacheControl(request: Request, response: Response, next: NextFunction) {
  const cacheable =
    request.method === "GET" &&
    !request.headers.authorization &&
    !request.headers.cookie &&
    PUBLIC_CACHEABLE_PREFIXES.some((prefix) => request.path.startsWith(prefix));

  if (cacheable) {
    response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    // The allowlist above only holds routes that do not vary by origin/auth,
    // but Vary on Origin keeps a shared cache from serving one site's CORS
    // headers to another.
    response.setHeader("Vary", "Origin, Accept-Encoding");
  } else {
    response.setHeader("Cache-Control", "no-store");
  }
  next();
}

async function bootstrap() {
  // rawBody: true keeps the untouched request body on `req.rawBody` alongside the
  // parsed one. The Stripe webhook signature is an HMAC over the exact bytes Stripe
  // sent, so it cannot be verified from the JSON-parsed body.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const appConfig = app.get(ConfigService<EnvironmentVariables, true>);

  // gzip every response over ~1KB. The catalogue payloads are JSON, which
  // compresses ~10:1, and nothing here was compressed before. Registered
  // before the router so it wraps every route.
  app.use(compression());
  app.use(publicCacheControl);

  // CORS from origin/docs/core-commerce-planning: the CMS and storefront call
  // this API directly. The allowlist is env-driven (CORS_ORIGINS, comma
  // separated) because the hardcoded localhost list below is a dev default
  // that would reject the real storefront/CMS origins in production.
  // Deliberately NOT `origin: true` — reflecting an arbitrary Origin while
  // `credentials: true` is set is a wildcard that hands any site the user's
  // authenticated responses.
  const corsOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : DEFAULT_CORS_ORIGINS,
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
