import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class BeginRegistrationDto {
  @IsString()
  @IsNotEmpty()
  initData!: string;
}

export class MiniAppLoginDto {
  @IsString()
  @IsNotEmpty()
  initData!: string;

  @IsString()
  @IsOptional()
  username?: string;
}

export class RequestCodeDto {
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

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  initData!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  @IsOptional()
  username?: string;
}
