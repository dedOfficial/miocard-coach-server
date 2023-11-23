import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SmsDocument = Sms & Document;

@Schema({ timestamps: true })
export class Sms {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  text: string;
}

export const SmsSchema = SchemaFactory.createForClass(Sms);
