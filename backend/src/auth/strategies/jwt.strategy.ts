import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // Lo que retorna se inyecta en request.user.
  // businessId estara presente en admins; null en cliente/super-admin.
  async validate(payload: {
    sub: string;
    role: string;
    businessId: string | null;
  }) {
    return {
      userId: payload.sub,
      role: payload.role,
      businessId: payload.businessId ?? null,
    };
  }
}
