import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CheckinDocument = Checkin & Document;

@Schema({ timestamps: true })
export class Checkin {
  @Prop()
  isLate: boolean;

  @Prop()
  isInterrupt: boolean;

  @Prop()
  isNotGetInTouch: boolean;

  @Prop()
  isPostpone: boolean;

  @Prop()
  isRushes: boolean;

  @Prop()
  isComplain: boolean;

  @Prop()
  isProblems: boolean;

  @Prop()
  isLongTime: boolean;

  @Prop()
  isNotParticipate: boolean;

  @Prop()
  isBusy: boolean;

  @Prop()
  additionally: string;

  @Prop()
  chatId: string;

  @Prop()
  checkinNumber: number;
}

export const CheckinSchema = SchemaFactory.createForClass(Checkin);
