import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import { ObjectivesController } from './objectives.controller';
import { ObjectivesService } from './objectives.service';
import { Objectives, ObjectivesSchema } from './models/objectives.model';
import { OperatorModule } from 'modules/operator/operator.module';
import { StatsModule } from 'modules/stats/stats.module';
import { TrackedParametersModule } from 'modules/trackedParameters/trackedParameters.module';
import { ChatModule } from 'modules/chat/chat.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Objectives.name, schema: ObjectivesSchema },
    ]),
    OperatorModule,
    StatsModule,
    TrackedParametersModule,
    ChatModule,
  ],
  providers: [ObjectivesService],
  controllers: [ObjectivesController],
})
export class ObjectivesModule {}
