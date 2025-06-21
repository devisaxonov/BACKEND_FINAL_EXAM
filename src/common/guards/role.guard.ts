import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
class RoleGuard implements CanActivate {
  constructor(private readonly reflect: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const roles = this.reflect.get('roles', handler);
    const role = request.user.role;
    if (!roles.includes(role))
      throw new ForbiddenException('Forbidden resources');
    return true;
  }
}

export default RoleGuard;
