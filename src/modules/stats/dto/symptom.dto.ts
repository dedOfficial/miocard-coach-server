import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsMobilePhone,
  IsIn,
  ValidateNested,
  IsNotEmptyObject,
  IsObject,
  IsArray,
} from 'class-validator';

import {
  AllOWED_CHECKIN_NUMBER,
  AllOWED_NOT_RECEIVED_REASONS,
} from '../constants';
import { Type } from 'class-transformer';

export class SymptomDto {
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => SymptomValueDto)
  symptom: {
    cardiovascular: string[];
    nonCardiovascular: string;
    isAbsent: boolean;
  };

  @IsBoolean()
  @IsNotEmpty()
  isReceived: boolean;

  @IsOptional()
  @IsString()
  @IsIn(AllOWED_NOT_RECEIVED_REASONS)
  notReceivedReason: string;
}

class SymptomValueDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cardiovascular: string[];

  @IsString()
  @IsOptional()
  nonCardiovascular: string;

  @IsBoolean()
  @IsOptional()
  isAbsent: boolean;
}

export class AddSymptomDto extends SymptomDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  day: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  time: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(AllOWED_CHECKIN_NUMBER)
  checkin: string;

  @IsMongoId()
  @IsNotEmpty()
  chatId: string;

  @IsMongoId()
  @IsNotEmpty()
  kitId: string;
}

export class GetSymptomDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}

export class GetDistinctSymptomDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}

export class UpdateSymptomDto extends SymptomDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class DeleteSymptomDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsMongoId()
  @IsNotEmpty()
  chatId: string;

  @IsNotEmpty()
  @IsString()
  day: string;

  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;

  @IsMongoId()
  @IsNotEmpty()
  kitId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(AllOWED_CHECKIN_NUMBER)
  checkin: string;
}
