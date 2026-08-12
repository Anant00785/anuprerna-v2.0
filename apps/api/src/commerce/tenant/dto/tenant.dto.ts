import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ example: "Anant Kumar", description: "User Name" })
  userName?: string;

  @ApiPropertyOptional({ example: "+919876543210", description: "Contact Number" })
  contactNumber?: string;

  @ApiPropertyOptional({ example: "1995-05-15", description: "Date of Birth (YYYY-MM-DD)" })
  dob?: string;

  @ApiPropertyOptional({ example: "MALE", description: "Gender (MALE / FEMALE / OTHER)" })
  gender?: string;
}

export function parseUpdateCustomerProfileInput(body: any) {
  return {
    userName: body?.userName,
    contactNumber: body?.contactNumber,
    dob: body?.dob,
    gender: body?.gender,
  };
}

export function parseUserRoleFilterInput(query: any) {
  return {
    page: query?.page ? parseInt(query.page, 10) : 1,
    limit: query?.limit ? parseInt(query.limit, 10) : 10,
  };
}
