import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Root")
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: "API Service Info & Health" })
  getRoot() {
    return {
      status: "online",
      name: "Anuprerna Backend API",
      version: "2.0.0",
      documentation: "/docs",
      endpoints: {
        swaggerDocs: "/docs",
        healthCheck: "/health",
        auth: "/auth/login",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
