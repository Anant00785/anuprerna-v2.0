import { Module } from "@nestjs/common";

// Auth, sessions, dual-accept tokens (accept legacy Loom JWT AND new native token during migration), delegated resolver.
@Module({})
export class IdentityModule {}
