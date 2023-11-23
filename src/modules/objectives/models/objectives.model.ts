import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ObjectivesDocument = Objectives & Document;

@Schema({ timestamps: true })
export class Objectives {
  @Prop({ required: true })
  name: string;

  @Prop({ default: [] })
  keyResults: Array<{
    name: string;
    trackingParameter: string;
    firstNormValue: {
      value: number;
      percentage: boolean;
    };
    secondNormValue: {
      value: number;
      percentage: boolean;
    };
  }>;
}

export const ObjectivesSchema = SchemaFactory.createForClass(Objectives);
