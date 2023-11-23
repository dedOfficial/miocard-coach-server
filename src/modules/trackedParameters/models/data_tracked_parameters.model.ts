import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PlannedCheckinDTO } from '../dto/dataTrackedParameters.dto';

export type DataTrackedParametersDocument = Data_tracked_parameters & Document;

@Schema({ timestamps: true })
export class Data_tracked_parameters {
  @Prop({ required: true })
  chatId: string;

  @Prop()
  plannedCheckins: PlannedCheckinDTO[];
}

export const DataTrackedParametersSchema = SchemaFactory.createForClass(
  Data_tracked_parameters,
);
