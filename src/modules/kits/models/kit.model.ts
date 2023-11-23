import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { KitChatDto, KitCheckinDto } from '../dto/create-kit.dto';

export type KitDocument = Kit & Document;

@Schema({ timestamps: true })
export class Kit {
  @Prop()
  name: string;

  @Prop()
  fillingSuccess: number;

  @Prop()
  chats: Array<KitChatDto>;

  @Prop()
  checkins: Array<KitCheckinDto>;
}

export const KitSchema = SchemaFactory.createForClass(Kit);
