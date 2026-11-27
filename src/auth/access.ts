import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../database/entities';

export const PUBLIC = 'public';
export const ROLES = 'roles';
export const Public = () => SetMetadata(PUBLIC, true);
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

export interface Actor {
  userId: number;
  email: string;
  role: Role;
  profileId: number | null;
}

export const CurrentActor = createParamDecorator((_data: unknown, context: ExecutionContext): Actor =>
  context.switchToHttp().getRequest<Request & { actor: Actor }>().actor,
);
