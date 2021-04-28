import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    return user;
  }

  async login(user) {
    const payload = { username: user.username, userid: user.id };
    return {
      asscess_token: this.jwtService.sign(payload),
    };
  }
}
