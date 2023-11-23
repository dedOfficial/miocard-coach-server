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

export class NotesDto {
  @IsString()
  @IsOptional()
  notes: string;
}

export class CreateNotesDto extends NotesDto {
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

export class UpdateNotesDto extends NotesDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class DeleteNotesDto {
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
}

export class GetNotesDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}

export class GetDistinctNotesDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}
