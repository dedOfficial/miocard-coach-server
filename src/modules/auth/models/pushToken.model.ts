import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PushTokenDocument = PushToken & Document;

@Schema()
export class PushToken {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  pushToken: string;

  @Prop({ required: true })
  platform: 'android' | 'ios';

  @Prop({ required: true })
  deviceId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const PushTokenSchema = SchemaFactory.createForClass(PushToken);
