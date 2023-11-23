import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCheckinDto {
  @IsBoolean()
  @IsOptional()
  isLate?: boolean;

  @IsBoolean()
  @IsOptional()
  isInterrupt?: boolean;

  @IsBoolean()
  @IsOptional()
  isNotGetInTouch?: boolean;

  @IsBoolean()
  @IsOptional()
  isPostpone?: boolean;

  @IsBoolean()
  @IsOptional()
  isRushes?: boolean;

  @IsBoolean()
  @IsOptional()
  isComplain?: boolean;

  @IsBoolean()
  @IsOptional()
  isProblems?: boolean;

  @IsBoolean()
  @IsOptional()
  isLongTime?: boolean;

  @IsBoolean()
  @IsOptional()
  isNotParticipate?: boolean;

  @IsBoolean()
  @IsOptional()
  isBusy?: boolean;

  @IsString()
  @IsOptional()
  additionally: string;

  @IsString()
  chatId: string;

  @IsNumber()
  checkinNumber: number;
}
