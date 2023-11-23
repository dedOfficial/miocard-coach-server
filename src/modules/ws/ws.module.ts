import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { StatsModule } from '../stats/stats.module';
import { WsGateway } from './ws.gateway';

@Module({
  imports: [ChatModule, StatsModule],
  providers: [WsGateway],
})
export class WsModule {}
