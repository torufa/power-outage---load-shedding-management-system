export interface IUpdateUserProfile {
  name?: string;
  phone?: string;
  areaId?: string;
  avatarUrl?: string;
}

export interface IUserFilterQuery {
  role?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
}
