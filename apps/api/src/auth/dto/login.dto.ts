import { IsEmail, IsString, MinLength } from 'class-validator';

/** Payload for POST /api/auth/login. */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
