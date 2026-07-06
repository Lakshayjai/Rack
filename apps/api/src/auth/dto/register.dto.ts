import { IsEmail, IsIn, IsString, MinLength, MaxLength } from 'class-validator';
import { GENDERS, type Gender } from 'shared-types';

/** Payload for POST /api/auth/register. */
export class RegisterDto {
  @IsEmail()
  email!: string;

  /** Whose wardrobe this is — drives category/type options in the UI. */
  @IsIn(GENDERS)
  gender!: Gender;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt hard limit
  password!: string;
}
