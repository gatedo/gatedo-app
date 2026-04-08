import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers?.authorization || '';

    if (!auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = auth.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      
      // NORMALIZA para o padrão esperado pelos services/controllers
      request.user = {
        ...payload,
        id: payload?.id || payload?.sub || null,
        sub: payload?.sub || payload?.id || null,
        email: payload?.email || null,
        role: payload?.role || null,
        plan: payload?.plan || null,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}