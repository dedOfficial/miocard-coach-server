import {
  IsMongoId,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  MinLength,
  IsIn,
  IsBoolean,
  IsOptional,
} from 'class-validator';

import {
  AllOWED_CHECKIN_NUMBER,
  AllOWED_NOT_RECEIVED_REASONS,
} from '../constants';

export class MoodDto {
  @IsString()
  @IsOptional()
  mood: string;

  @IsBoolean()
  @IsNotEmpty()
  isReceived: boolean;

  @IsOptional()
  @IsString()
  @IsIn(AllOWED_NOT_RECEIVED_REASONS)
  notReceivedReason: string;
}

export class CreateMoodDto extends MoodDto {
  @IsMongoId()
  @IsNotEmpty()
  chatId: string;

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
  kitId: string;
}

export class UpdateMoodDto extends MoodDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class DeleteMoodDto {
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

export class GetMoodDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}

export class GetDistinctMoodDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}
