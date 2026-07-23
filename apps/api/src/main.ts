import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

// Bootstrap stub — wire pino, request-id, health, and Sentry here (see common/).
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 8090);
}
bootstrap();
