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
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

// Drizzle maps PostgreSQL bigint columns to JavaScript bigint values. Express
// serializes controller responses through JSON.stringify, so normalize them at
// the application boundary rather than duplicating conversion in repositories.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Anuprerna API")
    .setDescription("Migrated LOOM Backend")
    .setVersion("2.0")
    .addBearerAuth()
    .addTag("Health")
    .addTag("Authentication")
    .addTag("Cart")
    .build();

  // Enable Swagger by default in non-production environments.
  // In production set `SWAGGER=true` to explicitly enable it.
  const enableSwagger = process.env.NODE_ENV !== "production" || process.env.SWAGGER === "true";

  if (enableSwagger) {
    const document = SwaggerModule.createDocument(app, config);
    const migratedCommerceTags = new Set([
      "Catalog",
      "Content",
      "FAQ",
      "Filter",
      "Navigation",
      "Search",
      "SEO",
    ]);

    // The migrated handlers deliberately parse unknown JSON through their
    // existing validators. Describe that boundary once in OpenAPI instead of
    // duplicating those runtime DTO contracts in Swagger-only classes.
    for (const pathItem of Object.values(document.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!operation || typeof operation !== "object" || !Array.isArray(operation.tags)) continue;
        if (!operation.tags.some((tag: string) => migratedCommerceTags.has(tag))) continue;

        if (["post", "patch"].includes(method) && !operation.requestBody) {
          operation.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: true,
                  description: "JSON payload validated by the endpoint's existing parser and validator.",
                },
              },
            },
          };
        }

        const successCode = method === "post" ? "201" : "200";
        operation.responses[successCode] ??= {
          description: "Successful response.",
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        };
      }
    }
    // Serve Swagger UI under /api/docs to match API prefixing.
    SwaggerModule.setup("api/docs", app, document, { jsonDocumentUrl: "api-json" });
  }

  await app.listen(process.env.PORT ?? 3000);

  const url = await app.getUrl();
  console.log("🚀 Server running at:", url);
  if (enableSwagger) console.log("📖 Swagger UI:", `${url}/api/docs`);
}

bootstrap();
