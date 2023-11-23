import {
  IsMongoId,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  MinLength,
  IsNumber,
  IsIn,
  IsBoolean,
  Min,
  IsOptional,
} from 'class-validator';

import {
  AllOWED_CHECKIN_NUMBER,
  AllOWED_NOT_RECEIVED_REASONS,
} from '../constants';

export class HabitDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  repeatability: number;

  @IsBoolean()
  @IsNotEmpty()
  isReceived: boolean;

  @IsOptional()
  @IsString()
  @IsIn(AllOWED_NOT_RECEIVED_REASONS)
  notReceivedReason: string;
}

export class CreateHabitDto extends HabitDto {
  @IsMongoId()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  habitId: string;

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

export class GetHabitsDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}

export class GetDistinctHabitDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}

export class UpdateHabitDto extends HabitDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class DeleteHabitDto {
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
