import { ApiProperty } from "@nestjs/swagger";

export class CreatePatternDto {
  @ApiProperty({ example: "Traditional Jamdani Floral Motif", description: "Pattern Name" })
  name!: string;
}

export class UpdatePatternDto {
  @ApiProperty({ example: 10, description: "Pattern ID" })
  id!: number;

  @ApiProperty({ example: "Traditional Jamdani Floral Motif (Updated)", description: "Pattern Name" })
  name?: string;
}

export function parseAddPatternInput(body: any) {
  return { name: body?.name };
}

export function parseUpdatePatternInput(body: any) {
  return { id: body?.id, name: body?.name };
}
