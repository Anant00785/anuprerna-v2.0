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
    // Serve Swagger UI under /api/docs to match API prefixing.
    SwaggerModule.setup("api/docs", app, document, { jsonDocumentUrl: "api-json" });
  }

  await app.listen(process.env.PORT ?? 3000);

  const url = await app.getUrl();
  console.log("🚀 Server running at:", url);
  if (enableSwagger) console.log("📖 Swagger UI:", `${url}/api/docs`);
}

bootstrap();