import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function found<T>(record: T | null, name: string): T {
  if (!record) throw new NotFoundException(name + ' not found');
  return record;
}

export async function write<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;
      if (code === 'ER_DUP_ENTRY') throw new ConflictException('A unique value is already in use');
      if (code === 'ER_ROW_IS_REFERENCED_2') throw new ConflictException('Other records depend on this record');
      if (code === 'ER_NO_REFERENCED_ROW_2') throw new ConflictException('A related record no longer exists');
    }
    throw error;
  }
}
