import { IsOptional, IsString } from 'class-validator';

export class AiQueryDto {
  @IsString()
  message!: string;

  @IsString()
  @IsOptional()
  context?: string;
}
