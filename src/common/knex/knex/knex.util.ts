import { knex } from 'knex';
import { KnexOptions } from './knex.interface';

export const createKnexConnection = (options: KnexOptions): any =>
  knex(options);
