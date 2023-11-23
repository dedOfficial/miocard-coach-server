import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  MinLength,
  IsArray,
  IsNotEmptyObject,
  IsObject,
  ValidateNested,
  IsBoolean,
  IsIn,
  IsMongoId,
  ArrayMinSize,
} from 'class-validator';

import { AllOWED_OBJECTIVE_KEY_RESULT_TRACKING_PARAMETERS } from '../constants';

export class ObjectiveNormValueDto {
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsBoolean()
  @IsNotEmpty()
  percentage: boolean;
}

export class ObjectiveKeyResultDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(AllOWED_OBJECTIVE_KEY_RESULT_TRACKING_PARAMETERS)
  @IsNotEmpty()
  trackingParameter: string;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ObjectiveNormValueDto)
  firstNormValue: ObjectiveNormValueDto;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ObjectiveNormValueDto)
  @IsOptional()
  secondNormValue: ObjectiveNormValueDto;
}

export class CreateObjectiveDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ObjectiveKeyResultDto)
  keyResults: ObjectiveKeyResultDto[];
}

export class UpdateObjectiveDto extends CreateObjectiveDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class DeleteObjectiveDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class GetObjectiveStatByKeyResultDto {
  @IsMongoId()
  @IsNotEmpty()
  objectiveId: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  keyResultName: string;
}

export class GetObjectiveDto {
  @IsMongoId()
  @IsNotEmpty()
  objectiveId: string;
}
