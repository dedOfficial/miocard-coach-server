import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import values = require('lodash/values');

import { EAllowedCheckinOptions } from 'modules/stats/constants';
import { EAllowedKitCheckinName } from '../constants';

export class KitCheckinDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: EAllowedKitCheckinName;

  @IsEnum(EAllowedCheckinOptions, {
    each: true,
    message: `Enum must be equal to one of these values ${values(
      EAllowedCheckinOptions,
    )}`,
  })
  @ArrayUnique()
  @ArrayMinSize(1)
  options: EAllowedCheckinOptions[];

  @IsNumber()
  @IsNotEmpty()
  position: number;
}

export class KitChatDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @IsOptional()
  fillingSuccess: number;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;
}

export class CreateAndUpdateKitDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => KitCheckinDto)
  checkins: KitCheckinDto[];
}

export class AssignChatsToKitDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KitChatDto)
  chats: KitChatDto[];
}
