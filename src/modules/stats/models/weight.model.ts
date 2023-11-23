import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WeightDocument = Weight & Document;

@Schema({ timestamps: true })
export class Weight {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({ required: true })
  weight: number;

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

  @Prop({ type: Date })
  measuredAt: Date;

  @Prop({ required: true })
  chatId: string;
}

export const WeightSchema = SchemaFactory.createForClass(Weight);
