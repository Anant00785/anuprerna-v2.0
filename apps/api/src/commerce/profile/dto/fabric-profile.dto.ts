import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class FabricProfileItemInputDto {
  @ApiPropertyOptional({ example: 0, description: "Item ID (0 or omitted for new item)" })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ example: 655838, description: "Fabric Product ID" })
  @IsNotEmpty()
  @IsNumber()
  fabricId!: number;

  @ApiPropertyOptional({ example: "https://anuprerna.com/images/mockup1.jpg", description: "Mockup Image URL" })
  @IsOptional()
  @IsString()
  mockupImage?: string;

  @ApiPropertyOptional({ example: "Handspun Khadi Fabric", description: "Mockup label/description" })
  @IsOptional()
  @IsString()
  mockupText?: string;
}

export class CreateFabricProfileDto {
  @ApiProperty({ example: "Organic Khadi Selection", description: "Unique profile name" })
  @IsNotEmpty()
  @IsString()
  profileName!: string;

  @ApiPropertyOptional({ type: [FabricProfileItemInputDto], description: "Fabric item list" })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FabricProfileItemInputDto)
  fabricProfileItemList?: FabricProfileItemInputDto[];
}

export class UpdateFabricProfileDto {
  @ApiProperty({ example: "Organic Khadi Selection Updated", description: "Unique profile name" })
  @IsNotEmpty()
  @IsString()
  profileName!: string;

  @ApiPropertyOptional({ type: [FabricProfileItemInputDto], description: "Fabric item list to update/add" })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FabricProfileItemInputDto)
  fabricProfileItemList?: FabricProfileItemInputDto[];
}
