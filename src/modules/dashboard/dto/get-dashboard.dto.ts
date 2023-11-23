import { IsNotEmpty, IsMongoId } from 'class-validator';

export class GetDashboardDto {
  @IsMongoId()
  @IsNotEmpty()
  chatId: string;
}

export class GetOperatorDashboardDto {
  @IsMongoId()
  @IsNotEmpty()
  operatorId: string;
}
