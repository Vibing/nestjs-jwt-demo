import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/common/knex/knex/knex.constants';

@Injectable()
export class UsersService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}
  async findOne(username: string): Promise<any> {
    return await this.knex('user').where({ username });
  }
}
