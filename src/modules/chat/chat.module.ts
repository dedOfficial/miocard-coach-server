import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Message, MessageSchema } from 'modules/operator/models/message.model';
import { OperatorModule } from 'modules/operator/operator.module';
import { Chat, ChatSchema } from 'modules/operator/models/chat.model';
import { StatsModule } from 'modules/stats/stats.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    forwardRef(() => OperatorModule),
    StatsModule,
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
