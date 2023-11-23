export class CreateChatMessageDto {
  fromOperator: boolean;
  fromDoctor: boolean;
  body: string;
  chatId: string;
  userError?: boolean;
  repliedMessageId?: string;
  repliedMessageBody?: string;
}
