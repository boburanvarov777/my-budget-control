import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthTelegramDto {
  @IsString()
  @IsNotEmpty()
  initData!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  username?: string;
}
