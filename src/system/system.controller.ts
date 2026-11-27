import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../auth/access';

@Public()
@Controller()
export class SystemController {
  constructor(private readonly database: DataSource) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('db-test')
  async databaseStatus() {
    try {
      await this.database.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('Database connection unavailable');
    }
    return { status: 'connected' };
  }
}
