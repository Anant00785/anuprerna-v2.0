import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateMaterialDto {
  @ApiProperty({ example: "Organic Khadi Cotton", description: "Material Name" })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class UpdateMaterialDto {
  @ApiProperty({ example: 2570, description: "Material ID (e.g. 2570 for Cotton, 2572 for Handspun Khadi, 2705 for Linen)" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "Organic Cotton (Updated)", description: "Updated Material Name" })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export function parseAddMaterialInput(body: any) {
  return { name: body?.name };
}

export function parseUpdateMaterialInput(body: any) {
  return { id: body?.id !== undefined ? BigInt(body.id) : undefined, name: body?.name };
}
