import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/** Payload for POST /api/auth/register. */
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt hard limit
  password!: string;
}
