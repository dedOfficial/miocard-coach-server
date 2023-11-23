import { UpdateChatDto } from '../dto/update-chat.dto';
import { ChatDocument } from '../models/chat.model';
import { OperatorForChat } from '../enums/operators-for-chat.enum';

export const checkEqualPlannedCheckins = (
  chat: ChatDocument,
  chatUpdate: UpdateChatDto,
) => {
  switch (chat.type) {
    case OperatorForChat.COACH:
      return chat.checkinsPerWeek === chatUpdate.checkinsPerWeek;
    case OperatorForChat.ASSISTANT:
      return (
        chat.assistantCheckinsPerWeek === chatUpdate.assistantCheckinsPerWeek
      );
  }
};

export const argumentsToSetPlannedCheckins = (
  chat: ChatDocument & {
    checkinsPerMonth?: number;
    assistantCheckinsPerMonth?: number;
  },
  chatUpdate: UpdateChatDto,
) => ({
  chatId: chat.shortKey,
  newValue:
    chat.type === OperatorForChat.COACH
      ? chatUpdate.checkinsPerWeek
      : chatUpdate.assistantCheckinsPerWeek,
  oldValue:
    chat.type === OperatorForChat.COACH
      ? chat.checkinsPerWeek
      : chat.assistantCheckinsPerWeek,
});
