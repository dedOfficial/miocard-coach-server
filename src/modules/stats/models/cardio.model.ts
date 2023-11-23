import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CardioDocument = Cardio & Document;

@Schema({ timestamps: true })
export class Cardio {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({ required: true, default: '0/0' })
  pressure: string;

  @Prop({ required: true, default: 0 })
  pulse: number;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  time: string;

  @Prop({ default: '' })
  checkin: string;

  @Prop({ required: true, default: false })
  isReceived: boolean;

  @Prop()
  notReceivedReason: string;

  @Prop()
  timeOfDay: string;

  @Prop({ type: Date })
  measuredAt: Date;

  @Prop({ required: true })
  chatId: string;
}

export const CardioSchema = SchemaFactory.createForClass(Cardio);
