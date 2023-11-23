import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PinDocument = Pin & Document;

@Schema()
export class Pin {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  pin: string;

  @Prop({ type: Date, expires: '10m', default: Date.now })
  createdAt: Date;
}

export const PinSchema = SchemaFactory.createForClass(Pin);
