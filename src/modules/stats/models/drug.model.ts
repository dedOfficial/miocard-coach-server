import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DrugDocument = Drug & Document;

@Schema({ timestamps: true })
export class Drug {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({ default: '' })
  drug: string;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  time: string;

  @Prop({ default: '' })
  checkin: string;

  @Prop({ required: true })
  drugId: string;

  @Prop({ required: true, default: false })
  isReceived: boolean;

  @Prop()
  notReceivedReason: string;

  @Prop({ type: Date })
  measuredAt: Date;

  @Prop({ required: true })
  chatId: string;
}

export const DrugSchema = SchemaFactory.createForClass(Drug);
