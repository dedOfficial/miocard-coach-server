import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TrackedParametersDocument = Tracked_parameters & Document;

@Schema({ timestamps: true })
export class Tracked_parameters {
  @Prop({ required: true })
  trackingName: string;

  @Prop({ required: true })
  trackingParameter: string;

  @Prop({ required: true })
  value: number;

  @Prop({ default: false })
  percentage: boolean;
}

export const TrackedParametersSchema = SchemaFactory.createForClass(
  Tracked_parameters,
);
