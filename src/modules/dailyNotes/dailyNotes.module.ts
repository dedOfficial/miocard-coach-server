import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DailyNotesService } from './dailyNotes.service';
import { DailyNotesController } from './dailyNotes.controller';
import { OperatorModule } from 'modules/operator/operator.module';

import { DailyNotes, DailyNotesSchema } from './models/dailyNotes.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyNotes.name, schema: DailyNotesSchema },
    ]),
    OperatorModule,
  ],
  providers: [DailyNotesService],
  controllers: [DailyNotesController],
})
export class DailyNotesModule {}
