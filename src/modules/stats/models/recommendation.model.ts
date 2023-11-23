import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecommendationDocument = Recommendation & Document;

@Schema({ timestamps: true })
export class Recommendation {
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
  recommendationId: string;

  @Prop({ required: true, default: false })
  isReceived: boolean;

  @Prop({ type: Date })
  measuredAt: Date;

  @Prop()
  notReceivedReason: string;

  @Prop({ required: true })
  chatId: string;
}

export const RecommendationSchema = SchemaFactory.createForClass(
  Recommendation,
);
