export interface IUpdateUserRole {
  role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
}

export interface IAuditLogQuery {
  page?: number;
  limit?: number;
}
