import { IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  operatorId: string;

  @IsString()
  task: string;
}
