import {
  IsMongoId,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
  ArrayUnique,
  IsIn,
  IsBoolean,
} from 'class-validator';
import values = require('lodash/values');

import {
  AllOWED_CHECKIN_NUMBER,
  AllOWED_NOT_RECEIVED_REASONS,
  EAllowedCheckinCheckboxes,
} from '../constants';

export class CheckinValuesDto {
  @IsEnum(EAllowedCheckinCheckboxes, {
    each: true,
    message: `Enum must be equal to one of these values ${values(
      EAllowedCheckinCheckboxes,
    )}`,
  })
  @ArrayUnique()
  @IsOptional()
  checkinCheckboxes: EAllowedCheckinCheckboxes[];

  @IsString()
  @IsOptional()
  additionally?: string;
}

export class CreateCheckinDto extends CheckinValuesDto {
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

  @IsBoolean()
  @IsNotEmpty()
  isReceived: boolean;

  @IsOptional()
  @IsString()
  @IsIn(AllOWED_NOT_RECEIVED_REASONS)
  notReceivedReason: string;

  @IsMongoId()
  @IsNotEmpty()
  kitId: string;
}

export class UpdateCheckinDto extends CheckinValuesDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class DeleteCheckinDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsMongoId()
  @IsNotEmpty()
  chatId: string;

  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;

  @IsMongoId()
  @IsNotEmpty()
  kitId: string;

  @IsNotEmpty()
  @IsString()
  day: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(AllOWED_CHECKIN_NUMBER)
  checkin: string;
}

export class GetCheckinDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}
