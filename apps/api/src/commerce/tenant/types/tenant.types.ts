export interface UpdateCustomerProfileDto {
  name?: string;
  phone?: string;
  address?: string;
}

export interface UserRoleFilterDto {
  page?: number;
  limit?: number;
}
