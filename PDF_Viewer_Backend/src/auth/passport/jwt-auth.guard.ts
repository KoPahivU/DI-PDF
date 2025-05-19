import { IS_PUBLIC_KEY } from '@/common/decorator/customize';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      try {
        const result = await super.canActivate(context);
        return true;
      } catch (error) {
        return true;
      }
    }

    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // For public routes, we still want to set the user if available
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // No error is thrown for public routes, user might be undefined
      return user;
    }

    // For protected routes, handle normally (throw error if no user)
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }

    return user;
  }
}
