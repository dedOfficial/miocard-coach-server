import {
  IsIn,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

import { AllOWED_TYPE_USER } from 'modules/operator/enums/operators-for-chat.enum';

export class AddDailyNoteDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(AllOWED_TYPE_USER)
  type: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  message: string;
}

export class GetDailyNotesDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}
