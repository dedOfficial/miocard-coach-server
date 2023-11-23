import { IsMobilePhone, IsNotEmpty } from 'class-validator';

export class GetStatsDto {
  @IsMobilePhone()
  @IsNotEmpty()
  clientNumber: string;
}
