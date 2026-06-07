import { IsString, MinLength, Matches } from 'class-validator';
import { IsCedulaDominicana } from '../../common/validators/cedula.validator';

export class RegisterDto {
  @IsCedulaDominicana()
  cedula: string;

  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  password: string;

  @IsString()
  nombre: string;

  @Matches(/^[0-9]{10}$/, { message: 'Telefono invalido (10 digitos)' })
  telefono: string;
}
