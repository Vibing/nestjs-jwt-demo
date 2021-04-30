import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async getHello(@Body() data) {
    return await this.authService.login(data);
  }

  // 使用路由级守卫
  @Get('test')
  // @UseGuards(AuthGuard())
  async test() {
    return 'test';
  }
}
