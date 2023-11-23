import { IsOptional, IsString } from 'class-validator';

export class BodyResponse {
  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsOptional()
  id: string;
}
