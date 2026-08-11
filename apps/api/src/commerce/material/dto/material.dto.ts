import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateMaterialDto {
  @ApiProperty({ example: "Organic Khadi Cotton", description: "Material Name" })
  name!: string;
}

export class UpdateMaterialDto {
  @ApiProperty({ example: 10, description: "Material ID" })
  id!: number;

  @ApiProperty({ example: "Organic Khadi Cotton (Updated)", description: "Material Name" })
  name?: string;
}

export function parseAddMaterialInput(body: any) {
  return { name: body?.name };
}

export function parseUpdateMaterialInput(body: any) {
  return { id: body?.id, name: body?.name };
}
