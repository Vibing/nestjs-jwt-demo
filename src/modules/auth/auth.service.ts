import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data) {
    const { username, password } = data;
    const user = (await this.usersService.findOne(username))[0];
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.password !== password) {
      throw new UnauthorizedException('密码不匹配');
    }

    const { id } = user;
    const payload = { id, username };
    const token = this.signToken(payload);

    return {
      ...payload,
      token,
    };
  }

  signToken(data) {
    return this.jwtService.sign(data);
  }
}
