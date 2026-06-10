import {
  IsHexColor,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
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
}
