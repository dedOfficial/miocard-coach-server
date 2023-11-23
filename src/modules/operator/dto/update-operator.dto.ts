import {
  IsMongoId,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsMobilePhone,
  IsEmail,
} from 'class-validator';

export class UpdateOperatorDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  basicInfo: string;

  @IsMobilePhone()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  avatar: string;

  @IsString()
  @IsOptional()
  type: string;
}
