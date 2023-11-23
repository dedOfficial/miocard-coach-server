import {
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsOptional()
  operatorId: string;

  @IsString()
  @IsOptional()
  assistantId: string;

  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;

  @IsString()
  @IsOptional()
  additionalInformation: string;
}
