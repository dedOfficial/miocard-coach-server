import { IsMongoId, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateTemplateDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  text: string;
}
