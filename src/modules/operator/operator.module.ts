import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatModule } from '../chat/chat.module';
import { MessageModule } from '../message/message.module';
import { Chat, ChatSchema } from './models/chat.model';
import { Operator, OperatorSchema } from './models/operator.model';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';
import { StatsModule } from '../stats/stats.module';
import { KitsModule } from '../kits/kits.module';
import { TrackedParametersModule } from '../trackedParameters/trackedParameters.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Operator.name, schema: OperatorSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    forwardRef(() => ChatModule),
    StatsModule,
    KitsModule,
    MessageModule,
    TrackedParametersModule,
  ],
  controllers: [OperatorController],
  providers: [OperatorService],
  exports: [OperatorService],
})
export class OperatorModule {}
