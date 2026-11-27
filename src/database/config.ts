import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';

export function databaseOptions(): DataSourceOptions {
  return {
    type: 'mysql',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'transportayo_prototype',
    synchronize: process.env.DB_SYNC === 'true',
    entities,
    charset: 'utf8mb4',
    timezone: 'Z',
  };
}
