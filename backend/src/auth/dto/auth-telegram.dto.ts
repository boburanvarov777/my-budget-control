import { IsNotEmpty, IsString } from 'class-validator';

export class BeginRegistrationDto {
  @IsString()
  @IsNotEmpty()
  initData!: string;
}

export class MiniAppLoginDto {
  @IsString()
  @IsNotEmpty()
  initData!: string;
}

export class CompleteRegistrationDto {
  @IsString()
  @IsNotEmpty()
  initData!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}
