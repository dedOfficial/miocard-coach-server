import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Role } from 'modules/operator/decorators/guard/role.enum';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateWebToken(name: string, email: string, roles: Role[]) {
    return this.jwtService.sign({ name, email, roles });
  }

  async generateMobileToken(phone: string) {
    return this.jwtService.sign({ phone });
  }
}
