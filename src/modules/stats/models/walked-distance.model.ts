import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WalkedDistanceDocument = WalkedDistance & Document;

@Schema({ timestamps: true })
export class WalkedDistance {
  @Prop({ required: true })
  clientNumber: string;

  @Prop({ required: true, default: 0 })
  walkedDistance: number;

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

export const WalkedDistanceSchema = SchemaFactory.createForClass(
  WalkedDistance,
);
