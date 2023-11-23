import {
  IsNumber,
  IsString,
  MinLength,
  IsNotEmpty,
  IsBoolean,
  IsIn,
  IsOptional,
  Min,
  IsMongoId,
} from 'class-validator';

import { AllOWED_TRACKED_PARAMETERS } from '../constants';

export class TrackedParametersDto {
  @IsNotEmpty()
  @MinLength(1)
  @IsString()
  trackingName: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(AllOWED_TRACKED_PARAMETERS)
  trackingParameter: string;

  @IsNotEmpty()
  @Min(0)
  @IsNumber()
  value: number;

  @IsBoolean()
  @IsOptional()
  percentage: boolean;
}

export class GetMeasurementsByChatByAllCoachesDto {
  @IsMongoId()
  @IsNotEmpty()
  operatorId: string;
}

export class GetCheckinProblemsByCoachDto {
  @IsMongoId()
  @IsNotEmpty()
  operatorId: string;
}

export class GetDataCollectionByChatByAllCoachesDto {
  @IsMongoId()
  @IsNotEmpty()
  operatorId: string;
}

export class GetPatientReturnByChatByAllCoachesDto {
  @IsMongoId()
  @IsNotEmpty()
  operatorId: string;
}

export class GetAllCheckinProblemsByChatDto {
  @IsMongoId()
  @IsNotEmpty()
  chatId: string;
}
