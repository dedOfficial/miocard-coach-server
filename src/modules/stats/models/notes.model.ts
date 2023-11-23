import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotesDocument = Notes & Document;

@Schema({ timestamps: true })
export class Notes {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({ default: '' })
  notes: string;

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

export const NotesSchema = SchemaFactory.createForClass(Notes);
