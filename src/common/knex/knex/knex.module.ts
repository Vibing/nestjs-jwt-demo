import { Module, DynamicModule, Global } from '@nestjs/common';
import { KnexOptions } from './knex.interface';
import { KNEX_CONNECTION } from './knex.constants';
import { createKnexConnection } from './knex.util';

@Global()
@Module({})
export class KnexModule {
  public static forRoot(options: KnexOptions): DynamicModule {
    const ConnectionProvider = {
      provide: KNEX_CONNECTION,
      useValue: createKnexConnection(options),
    };
    return {
      module: KnexModule,
      providers: [ConnectionProvider],
      exports: [ConnectionProvider],
    };
  }
}
