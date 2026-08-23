import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { UpdateSettingsRequest } from '../types/settings.types.js';

export class UpdateSettingsDto {
  @ApiProperty({ example: 1, description: "Setting unique identifier" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "true", description: "Setting attribute value (string, boolean or number representation)" })
  @IsNotEmpty()
  attributeValue!: any;

  @ApiPropertyOptional({ example: "https://anuprerna.com/notification", description: "Optional attribute reference link" })
  @IsOptional()
  @IsString()
  attributeLink?: string;
}

export function parseUpdateSettingsRequest(body: any): UpdateSettingsRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const id = BigInt(body.id);
  if (isNaN(Number(id))) {
      throw new Error('id must be a valid number');
  }

  const attributeValue = body.attributeValue;
  if (attributeValue === undefined || attributeValue === null) {
      throw new Error('attributeValue is required');
  }

  const attributeLink = typeof body.attributeLink === 'string' ? body.attributeLink : '';

  return {
    id,
    attributeValue,
    attributeLink,
  };
}
