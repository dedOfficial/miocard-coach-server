import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OperatorModule } from 'modules/operator/operator.module';
import { Cardio, CardioSchema } from 'modules/stats/models/cardio.model';
import {
  Tracked_parameters,
  TrackedParametersSchema,
} from './models/tracked_parameters.model';
import { TrackedParametersService } from './trackedParameters.service';
import { TrackedParametersController } from './trackedParameters.controller';
import { StatsModule } from 'modules/stats/stats.module';
import { ChatModule } from '../chat/chat.module';
import {
  Data_tracked_parameters,
  DataTrackedParametersSchema,
} from './models/data_tracked_parameters.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cardio.name, schema: CardioSchema },
      { name: Tracked_parameters.name, schema: TrackedParametersSchema },
      {
        name: Data_tracked_parameters.name,
        schema: DataTrackedParametersSchema,
      },
    ]),
    forwardRef(() => OperatorModule),
    StatsModule,
    ChatModule,
  ],
  providers: [TrackedParametersService],
  controllers: [TrackedParametersController],
  exports: [TrackedParametersService],
})
export class TrackedParametersModule {}
