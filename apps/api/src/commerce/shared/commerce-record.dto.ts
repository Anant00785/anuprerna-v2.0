import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCommerceRecordDto {
  @ApiProperty({ description: "Name of the record", example: "my-record", minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: "JSON payload with record data", example: { key: "value" }, type: Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
