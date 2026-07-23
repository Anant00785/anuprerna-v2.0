import { Module, Controller, Get } from "@nestjs/common";

@Controller("health")
class HealthController {
  @Get()
  check() { return { status: "ok", uptime: process.uptime() }; }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
