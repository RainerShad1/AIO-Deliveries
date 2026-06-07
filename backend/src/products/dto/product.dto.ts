import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString() nombre: string;
  @IsString() descripcion: string;
  @IsString() imagen: string;
  @IsNumber() @Min(0) precio: number;
  @IsOptional() @IsBoolean() activo?: boolean;
  @IsOptional() @IsString() categoryId?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() imagen?: string;
  @IsOptional() @IsNumber() @Min(0) precio?: number;
  @IsOptional() @IsBoolean() activo?: boolean;
  @IsOptional() @IsString() categoryId?: string | null;
}
