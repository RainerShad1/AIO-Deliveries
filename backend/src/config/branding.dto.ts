import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

// Branding que el ADMIN del propio negocio puede editar (no el super-admin).
// Todos opcionales: el admin actualiza solo lo que cambia.
export class BrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bannerUrl?: string; // URL de la imagen de portada de la tarjeta

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;

  @IsOptional()
  @IsHexColor()
  colorPrimary?: string;

  @IsOptional()
  @IsHexColor()
  colorBg?: string;

  @IsOptional()
  @IsHexColor()
  colorCard?: string;

  @IsOptional()
  @IsHexColor()
  colorAccent?: string;
}
