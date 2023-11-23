import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Sms, SmsSchema } from 'modules/operator/models/sms.model';
import { MessageService } from './message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageController } from './message.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Sms.name, schema: SmsSchema }]),
  ],
  providers: [MessageService],
  exports: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
