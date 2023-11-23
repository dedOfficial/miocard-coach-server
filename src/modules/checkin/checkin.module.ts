import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CheckinService } from './checkin.service';
import { Checkin, CheckinSchema } from './models/checkin.model';
import { CheckinController } from './checkin.controller';
import { OperatorModule } from 'modules/operator/operator.module';

// We do not use this Module
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Checkin.name, schema: CheckinSchema }]),
    OperatorModule,
  ],
  providers: [CheckinService],
  controllers: [CheckinController],
})
export class CheckinModule {}
