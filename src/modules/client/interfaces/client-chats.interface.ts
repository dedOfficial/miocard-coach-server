import { OperatorForChat } from '../../operator/enums/operators-for-chat.enum';

export interface ClientChats {
  operatorName: string;
  avatarUrl: string | null;
  type: OperatorForChat;
  chatKey: string;
  lastMessage: string | null;
}
