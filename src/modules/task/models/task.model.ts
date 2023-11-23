import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Operator } from 'modules/operator/models/operator.model';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true, versionKey: false })
export class Task {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
  })
  operatorId: mongoose.Types.ObjectId | Operator;

  @Prop({ required: true })
  task: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
