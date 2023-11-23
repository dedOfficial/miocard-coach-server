import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { EAllowedCheckinCheckboxes } from '../constants';

export type CheckinDocument = Checkin & Document;

@Schema({ timestamps: true })
export class Checkin {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  time: string;

  @Prop({ default: '' })
  checkin: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  additionally?: string;

  @Prop()
  checkinCheckboxes: EAllowedCheckinCheckboxes[];

  @Prop({ required: true, default: false })
  isReceived: boolean;

  @Prop()
  notReceivedReason: string;

  @Prop({ type: Date })
  measuredAt: Date;

  @Prop({ required: true })
  chatId: string;
}

export const CheckinSchema = SchemaFactory.createForClass(Checkin);
