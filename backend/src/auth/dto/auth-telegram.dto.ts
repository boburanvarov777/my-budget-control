import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Telegram initData strings are short; the cap keeps oversized bodies out. */
const MAX_INIT_DATA_LENGTH = 4096;

export class BeginRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_INIT_DATA_LENGTH)
  initData!: string;
}

export class MiniAppLoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_INIT_DATA_LENGTH)
  initData!: string;
}
