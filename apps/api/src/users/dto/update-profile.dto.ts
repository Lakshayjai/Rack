import { IsIn } from 'class-validator';
import { GENDERS, type Gender } from 'shared-types';

/** Payload for PATCH /api/users/me. */
export class UpdateProfileDto {
  @IsIn(GENDERS)
  gender!: Gender;
}
