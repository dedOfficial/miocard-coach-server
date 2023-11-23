import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { OperatorForChat } from '../../operator/enums/operators-for-chat.enum';

export class AssignOperatorToChatsDto {
  @IsMongoId()
  @IsNotEmpty()
  operatorId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  chats: string[];
}

export class DeleteOperatorFromChatsDto {
  @IsString()
  @IsNotEmpty()
  type: OperatorForChat;

  @IsString()
  @IsNotEmpty()
  chatId: string;
}
