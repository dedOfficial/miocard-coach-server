import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class PlannedCheckinDTO {
  @IsNotEmpty()
  @Min(0)
  @IsNumber()
  currentPlannedCheckins: number;

  @IsNotEmpty()
  @Min(0)
  @IsNumber()
  previousPlannedCheckins?: number;

  @IsNotEmpty()
  createdAt: Date;
}
