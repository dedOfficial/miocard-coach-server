import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsNumber,
  IsString,
  MinLength,
  IsArray,
  IsNotEmptyObject,
  IsObject,
  ValidateNested,
  IsDateString,
  Min,
  IsEmpty,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { EDrugFrequency, EDrugRegularity, EDrugType } from '../enums/drug.enum';

class ChatPersonalInfoDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  clientName: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  sex: string;

  @IsDateString()
  @IsOptional()
  // example "2022-07-10"
  dateOfBirth: Date;

  @IsString()
  @MinLength(1)
  @IsOptional()
  age: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  nation: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  city: string;

  @IsOptional()
  food: string;

  @IsOptional()
  stress: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  familyStatus: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  livesWith: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  levelOfEducation: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  jobProfession: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  jobDescription: string[];
}

export class ChatWeightDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  recommended: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  current: number;
}

class ChatHabitsDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  id: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  repeatability: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  limit: number;
}

class TestResultsDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  id: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(0)
  text: string;
}

class ChatRecommendationDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  id: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  min: number;
}

export class DrugRegularityDTO {
  @IsEnum(EDrugRegularity)
  value: EDrugRegularity;

  @IsString()
  @IsOptional()
  additional: string;
}

export class DrugFrequencyDTO {
  @IsEnum(EDrugFrequency)
  value: EDrugFrequency;

  @IsString()
  @IsOptional()
  additional: string;
}

class ChatDrugsDto {
  @IsString()
  @MinLength(1)
  id: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(EDrugType)
  type: EDrugType;

  @IsString()
  @MinLength(1)
  dosage: string;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => DrugRegularityDTO)
  regularity: DrugRegularityDTO;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => DrugFrequencyDTO)
  frequency: DrugFrequencyDTO;

  @IsString()
  @MinLength(1)
  indication: string;
}

class ChatDiseasesDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cardiovascularDiseases: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relativeDiseases: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronicDiseases: string[];

  @IsString()
  @IsOptional()
  otherDiseases: string;
}

export class ChatSelfEfficacyDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  norm: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  current: number;

  @IsEmpty()
  previous: number;
}

class ChatSysDiaBPDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  sys: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dia: number;
}

export class ChatBloodPressureDto {
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ChatSysDiaBPDto)
  @IsOptional()
  recommended: {
    sys: number;
    dia: number;
  };

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ChatSysDiaBPDto)
  @IsOptional()
  comfortable: {
    sys: number;
    dia: number;
  };
}

export class ChatHeartRateDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  recommended: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  comfortable: number;
}

export class UpdateChatDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ChatPersonalInfoDto)
  @IsOptional()
  personalInfo: ChatPersonalInfoDto;

  @IsString()
  @IsOptional()
  additionalInformation: string;

  @IsOptional()
  food: string;

  @IsOptional()
  lifestyleAssessment: string;

  @IsOptional()
  generalHealthRisks: string;

  @IsOptional()
  score: string;

  @IsOptional()
  bipq: string;

  @IsOptional()
  stress: string;

  @IsOptional()
  sleep: string;

  @IsOptional()
  sport: string;

  @IsOptional()
  badHabits: string;

  @IsOptional()
  understanding: string;

  @IsOptional()
  measurementErrors: string;

  @IsOptional()
  eysenck1: string;

  @IsOptional()
  eysenck2: string;

  @IsOptional()
  eysenck3: string;

  @IsOptional()
  eysenck4: string;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ChatWeightDto)
  @IsOptional()
  weight: ChatWeightDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  height: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChatHabitsDto)
  habits: ChatHabitsDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChatRecommendationDto)
  recommendations: ChatRecommendationDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TestResultsDto)
  testResults: TestResultsDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  bmi: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatDrugsDto)
  @IsOptional()
  drugs: ChatDrugsDto[];

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ChatDiseasesDto)
  @IsOptional()
  diseases: ChatDiseasesDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  checkinsPerWeek: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  assistantCheckinsPerWeek: number;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ChatSelfEfficacyDto)
  @IsOptional()
  selfEfficacy: ChatSelfEfficacyDto;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ChatBloodPressureDto)
  @IsOptional()
  bloodPressure: {
    recommended: {
      sys: number;
      dia: number;
    };
    comfortable: {
      sys: number;
      dia: number;
    };
  };

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ChatHeartRateDto)
  @IsOptional()
  heartRate: ChatHeartRateDto;
}

export class UpdateChatStatusDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
