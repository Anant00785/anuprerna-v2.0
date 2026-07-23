import { Module } from "@nestjs/common";

// Strangler proxy + write-guard. Forwards unconverted reads to legacy Loom, 501s writes. Shrinks to zero.
@Module({})
export class ProxyModule {}
