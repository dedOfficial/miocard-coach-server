import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, id: true })
export class Message {
  @Prop({ required: true })
  body: string;

  @Prop({ required: true })
  fromOperator: boolean;

  @Prop({ default: false })
  fromAssistant: boolean;

  @Prop({ default: false })
  fromDoctor: boolean;

  @Prop({ required: true })
  chatId: string;

  @Prop({ default: true })
  isActiveChat: boolean;

  @Prop({ default: false })
  userError: boolean;

  @Prop()
  repliedMessageId: string;

  @Prop()
  repliedMessageBody: string;

  @Prop()
  createdAt: Date;

  @Prop()
  seen: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
