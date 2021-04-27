import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { KnexModule } from './common/knex/knex/knex.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
