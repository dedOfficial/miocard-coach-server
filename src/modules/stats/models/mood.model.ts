import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MoodDocument = Mood & Document;

@Schema({ timestamps: true })
export class Mood {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({ default: '' })
  mood: string;

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

export const MoodSchema = SchemaFactory.createForClass(Mood);
