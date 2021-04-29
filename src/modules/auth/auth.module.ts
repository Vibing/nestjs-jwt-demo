import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secretOrPrivateKey: 'll@feifei',
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
