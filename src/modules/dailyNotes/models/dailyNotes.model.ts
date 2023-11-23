import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DailyNotesDocument = DailyNotes & Document;

@Schema({ timestamps: true })
export class DailyNotes {
  @Prop()
  clientNumber: string;

  @Prop()
  type: string;

  @Prop()
  message: string;
}

export const DailyNotesSchema = SchemaFactory.createForClass(DailyNotes);
