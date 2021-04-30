import { Module } from '@nestjs/common';
import { KnexModule } from './common/knex/knex/knex.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './guards/jwt.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    UsersModule,
    KnexModule.forRoot({
      client: 'mysql',
      connection: {
        host: '127.0.0.1',
        user: 'root',
        password: '123456',
        database: 'demo',
      },
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
