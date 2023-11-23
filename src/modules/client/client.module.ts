import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'modules/operator/models/chat.model';
import { Message, MessageSchema } from 'modules/operator/models/message.model';
import {
  Operator,
  OperatorSchema,
} from 'modules/operator/models/operator.model';
import { Cardio, CardioSchema } from 'modules/stats/models/cardio.model';
import { CalculateBpCron } from './calculate-bp.cron';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Operator.name, schema: OperatorSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Cardio.name, schema: CardioSchema },
    ]),
  ],
  controllers: [ClientController],
  providers: [ClientService, CalculateBpCron],
})
export class ClientModule {}
