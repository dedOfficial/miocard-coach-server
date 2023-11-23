import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { Role } from 'modules/operator/decorators/guard/role.enum';

export type OperatorDocument = Operator & Document;

@Schema({ timestamps: true })
export class Operator {
  @Prop({ required: true })
  email: string;

  @Prop({ requried: true })
  name: string;

  @Prop()
  password?: string;

  @Prop({ default: 'coach' })
  type?: 'coach' | 'assistant';

  @Prop({ default: false })
  isSuperadmin?: boolean;

  @Prop()
  avatar?: string;

  @Prop()
  basicInfo?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ default: [Role.User] })
  roles: Role[];
}

export const OperatorSchema = SchemaFactory.createForClass(Operator);
