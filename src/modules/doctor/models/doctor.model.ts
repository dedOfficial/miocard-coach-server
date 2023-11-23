import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DoctorDocument = Doctor & Document;

@Schema({ timestamps: true })
export class Doctor {
  @Prop({ required: true })
  number: string;

  @Prop({ requried: true })
  name: string;

  @Prop({ requried: true })
  email: string;

  @Prop()
  avatar?: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
