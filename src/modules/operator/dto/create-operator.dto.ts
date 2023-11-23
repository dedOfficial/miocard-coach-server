import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { OperatorForChat } from '../enums/operators-for-chat.enum';

export class CreateOperatorDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  basicInfo?: string;

  @IsEnum(OperatorForChat)
  @IsOptional()
  type?: OperatorForChat;

  @IsOptional()
  isSuperadmin?: boolean;

  @IsOptional()
  password?: string;
}
