import { BadRequestException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { EntityManager } from 'typeorm';
import { Role, User } from '../database/entities';

export function hashPassword(password: string) {
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new BadRequestException('Password must have at least 8 characters and at most 72 UTF-8 bytes');
  }
  return hash(password, 12);
}

export function createAccount(manager: EntityManager, email: string, passwordHash: string, role: Role) {
  const users = manager.getRepository(User);
  return users.save(users.create({ email: email.toLowerCase(), passwordHash, role }));
}
