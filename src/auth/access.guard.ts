import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from '../database/entities';
import { Actor, PUBLIC, ROLES } from './access';
import { AuthService } from './auth.service';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC, targets)) return true;

    const request = context.switchToHttp().getRequest<Request & { actor?: Actor }>();
    const token = /^Bearer ([^\s]+)$/i.exec(request.headers.authorization ?? '')?.[1];
    if (!token) throw new UnauthorizedException('Bearer token required');

    const actor = await this.auth.authenticate(token);
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, targets);
    if (roles && !roles.includes(actor.role)) throw new ForbiddenException('Role does not permit this action');
    request.actor = actor;
    return true;
  }
}
