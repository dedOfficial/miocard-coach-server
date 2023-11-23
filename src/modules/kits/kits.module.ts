import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatModule } from 'modules/chat/chat.module';
import { Chat, ChatSchema } from 'modules/operator/models/chat.model';
import { KitsController } from './kits.controller';
import { KitsService } from './kits.service';
import { Kit, KitSchema } from './models/kit.model';
import { StatsModule } from 'modules/stats/stats.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Kit.name, schema: KitSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    forwardRef(() => StatsModule),
    forwardRef(() => ChatModule),
  ],
  providers: [KitsService],
  controllers: [KitsController],
  exports: [KitsService],
})
export class KitsModule {}
