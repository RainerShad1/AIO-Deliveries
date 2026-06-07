import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // El registro publico SIEMPRE crea un CLIENTE global (businessId = null).
  // Los ADMIN de cada negocio se crean por seed o por el panel de Super-Admin
  // (Fase 3), nunca por este endpoint publico.
  async register(dto: RegisterDto) {
    const cedula = dto.cedula.replace(/-/g, '');
    const exists = await this.prisma.user.findUnique({ where: { cedula } });
    if (exists) throw new ConflictException('La cedula ya esta registrada');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        cedula,
        password: hash,
        nombre: dto.nombre,
        telefono: dto.telefono,
        // role por defecto CLIENTE, businessId queda null (cliente global)
      },
    });
    return this.sign(user.id, user.role, user.businessId);
  }

  async login(dto: LoginDto) {
    const cedula = dto.cedula.replace(/-/g, '');
    const user = await this.prisma.user.findUnique({ where: { cedula } });
    if (!user) throw new UnauthorizedException('Credenciales invalidas');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciales invalidas');

    return this.sign(user.id, user.role, user.businessId);
  }

  // El token ahora carga el businessId del usuario. Para CLIENTE y SUPER_ADMIN
  // es null; para ADMIN es el negocio al que pertenece. El aislamiento de datos
  // (Fase 1B) leera este businessId desde request.user en cada consulta.
  private sign(userId: string, role: string, businessId: string | null) {
    const payload = { sub: userId, role, businessId };
    return {
      access_token: this.jwt.sign(payload, { expiresIn: '7d' }),
      role,
      businessId,
    };
  }
}
