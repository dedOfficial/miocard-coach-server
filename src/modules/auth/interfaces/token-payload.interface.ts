import { Role } from 'modules/operator/decorators/guard/role.enum';

export interface TokenWebPayload {
  name: string;
  email: string;
  roles: Role[];
}

export interface TokenMobilePayload {
  phone: string;
}
