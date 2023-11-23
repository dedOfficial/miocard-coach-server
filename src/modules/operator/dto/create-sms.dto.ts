import { IsOptional, IsString } from 'class-validator';

export class CreateSmsDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  text: string;
}
