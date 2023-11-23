import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HabitDocument = Habit & Document;

@Schema({ timestamps: true })
export class Habit {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({ required: true })
  repeatability: number;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  time: string;

  @Prop({ default: '' })
  checkin: string;

  @Prop({ required: true })
  habitId: string;

  @Prop({ required: true, default: false })
  isReceived: boolean;

  @Prop()
  notReceivedReason: string;

  @Prop({ type: Date })
  measuredAt: Date;

  @Prop({ required: true })
  chatId: string;
}

export const HabitSchema = SchemaFactory.createForClass(Habit);
