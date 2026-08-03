import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MiniAppLoginDto {
  @IsString()
  @IsNotEmpty()
  initData!: string;

  @IsString()
  @IsOptional()
  username?: string;
}
