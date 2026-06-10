import {
  IsHexColor,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre: string;

  // slug para URL: minusculas, numeros y guiones
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug invalido: usa minusculas, numeros y guiones (ej: mi-negocio)',
  })
  @MaxLength(60)
  slug: string;

  // Admin inicial del negocio
  @IsString()
  @Matches(/^\d{11}$/, { message: 'cedula del admin: 11 digitos sin guiones' })
  adminCedula: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;

  @IsString()
  @MinLength(2)
  adminNombre: string;

  @IsString()
  @MinLength(10)
  @MaxLength(15)
  adminTelefono: string;

  // Branding opcional al crear
  @IsOptional() @IsHexColor() colorPrimary?: string;
  @IsOptional() @IsHexColor() colorBg?: string;
  @IsOptional() @IsHexColor() colorCard?: string;
  @IsOptional() @IsHexColor() colorAccent?: string;
}

export class UpdateBusinessDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) nombre?: string;
  @IsOptional() activo?: boolean;
  // White-label: visibilidad en el marketplace y grupo (cliente) al que pertenece
  @IsOptional() enMarketplace?: boolean;
  @IsOptional() @IsString() groupId?: string | null;
}

export class CreateGroupDto {
  @IsString() @MinLength(2) @MaxLength(80) nombre: string;
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug invalido: minusculas, numeros y guiones',
  })
  @MaxLength(60)
  slug: string;
  @IsOptional() @IsString() @MaxLength(500) logo?: string;
}

export class RegisterPaymentDto {
  @IsNumber()
  @Min(0)
  monto: number;

  @IsInt()
  @Min(1)
  @Max(24)
  meses: number;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  metodo: string; // "transferencia", "efectivo", etc.

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nota?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  plan?: string; // opcional: actualizar la etiqueta del plan al cobrar
}
