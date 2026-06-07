import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  cedula: string;

  @IsString()
  password: string;
}
