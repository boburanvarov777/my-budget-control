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
