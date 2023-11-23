import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SymptomDocument = Symptom & Document;

@Schema({ timestamps: true })
export class Symptom {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({
    type: Object,
    default: { cardiovascular: [''], nonCardiovascular: '', isAbsent: false },
    required: true,
  })
  symptom: {
    cardiovascular: string[];
    nonCardiovascular: string;
    isAbsent: boolean;
  };

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

export const SymptomSchema = SchemaFactory.createForClass(Symptom);
