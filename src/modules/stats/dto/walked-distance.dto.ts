import {
  IsMongoId,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  MinLength,
  IsIn,
  IsBoolean,
  Min,
  IsNumber,
  IsOptional,
} from 'class-validator';

import {
  AllOWED_CHECKIN_NUMBER,
  AllOWED_NOT_RECEIVED_REASONS,
} from '../constants';

export class WalkedDistanceDto {
  @IsNotEmpty()
  @Min(0)
  @IsNumber()
  walkedDistance: number;

  @IsBoolean()
  @IsNotEmpty()
  isReceived: boolean;

  @IsOptional()
  @IsString()
  @IsIn(AllOWED_NOT_RECEIVED_REASONS)
  notReceivedReason: string;
}

export class CreateWalkedDistanceDto extends WalkedDistanceDto {
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

export class UpdateWalkedDistanceDto extends WalkedDistanceDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class DeleteWalkedDistanceDto {
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

export class GetWalkedDistanceDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}

export class GetDistinctWalkedDistanceDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}
