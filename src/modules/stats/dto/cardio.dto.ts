import {
  IsBoolean,
  IsIn,
  IsMobilePhone,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

import {
  AllOWED_CHECKIN_NUMBER,
  AllOWED_NOT_RECEIVED_REASONS,
  AllOWED_TIME_OF_DAY_ADDING_STAT,
  REG_EX_PRESSURE_FORMAT,
  REG_EX_PRESSURE_MESSAGE_ERROR,
} from '../constants';

export class CardioDto {
  @Matches(REG_EX_PRESSURE_FORMAT, {
    message: REG_EX_PRESSURE_MESSAGE_ERROR,
  })
  pressure: string;

  @IsNumber()
  @IsNotEmpty()
  pulse: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(AllOWED_TIME_OF_DAY_ADDING_STAT)
  timeOfDay: string;

  @IsBoolean()
  @IsNotEmpty()
  isReceived: boolean;

  @IsOptional()
  @IsString()
  @IsIn(AllOWED_NOT_RECEIVED_REASONS)
  notReceivedReason: string;
}

export class AddCardioDto extends CardioDto {
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

export class UpdateCardioDto extends CardioDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class GetCardioDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}

export class DeleteCardioDto {
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
