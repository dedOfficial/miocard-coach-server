import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Chat, ChatDocument } from 'modules/operator/models/chat.model';
import { CreateChatMessageDto } from 'modules/operator/dto/create-chat-message.dto';
import {
  Message,
  MessageDocument,
} from 'modules/operator/models/message.model';
import { getTimeForFilteringChats } from './helpers';
import { OperatorForChat } from '../operator/enums/operators-for-chat.enum';
import {
  EPeriod,
  EPeriodOfTime,
  getStartAndEndOfPeriod,
} from '../../utils/common';

type LastMsgType = MessageDocument & { createdAt: Date };

const MAX_MESSAGES_PER_REQUEST = 15;
const MAX_MESSAGES_PER_REQUEST_WEB = 20;

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async createMessage(createMessageDto: CreateChatMessageDto) {
    const createdMessage = new this.messageModel(createMessageDto);
    return createdMessage.save();
  }

  async getMessages(chatId: string) {
    return this.messageModel.find({ chatId }).exec();
  }

  setMessagesSeenForChat(shortKey: string) {
    return this.messageModel
      .updateMany({ chatId: shortKey, seen: false }, { $set: { seen: true } })
      .exec();
  }

  async getCountDayPatientReturnByPeriod(
    shortKey: string,
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
  ): Promise<Array<{ date: string }>> {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];
    return this.messageModel.aggregate([
      {
        $match: {
          chatId: shortKey,
          fromOperator: false,
          fromAssistant: false,
          fromDoctor: false,
          isActiveChat: true,
          createdAt: {
            $gte: start.toDate(),
            $lte: end.toDate(),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%d-%m-%Y', date: '$createdAt' } },
        },
      },
      {
        $replaceWith: { date: '$_id' },
      },
    ]);
  }

  async getAmountOfUniqueDaysPatientReturnByPeriod(
    shortKey: string,
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
  ): Promise<Array<{ amount: number }>> {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];
    return this.messageModel.aggregate([
      {
        $match: {
          chatId: shortKey,
          fromOperator: false,
          fromAssistant: false,
          fromDoctor: false,
          createdAt: {
            $gte: start.toDate(),
            $lte: end.toDate(),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%d-%m-%Y', date: '$createdAt' } },
        },
      },
      {
        $count: 'amount',
      },
    ]);
  }

  getLastMessagesCountForChat(shortKey: string) {
    return this.messageModel
      .countDocuments({ chatId: shortKey, seen: false })
      .exec();
  }

  async getInitialMessages(chatId: string) {
    return this.messageModel
      .find({ chatId })
      .sort({ createdAt: 'desc' })
      .limit(MAX_MESSAGES_PER_REQUEST)
      .exec();
  }
  // Do not replace MAX_MESSAGES_PER_REQUEST directly, only as a single const value

  async getPartOfMessages(chatId: string, count: string) {
    const skipMessages = MAX_MESSAGES_PER_REQUEST * +count;

    return this.messageModel
      .find({ chatId })
      .sort({ createdAt: 'desc' })
      .skip(skipMessages)
      .limit(MAX_MESSAGES_PER_REQUEST)
      .exec();
  }

  getChatHistoryPartly(chatId: string, count: string) {
    const skipMessages = MAX_MESSAGES_PER_REQUEST_WEB * +count;

    return this.messageModel
      .find({ chatId })
      .skip(skipMessages)
      .limit(MAX_MESSAGES_PER_REQUEST_WEB)
      .exec();
  }

  async getLastMessage(chatId: string) {
    const lastMsg = (await this.messageModel
      .findOne({ chatId })
      .sort('-createdAt')
      .exec()) as LastMsgType;

    if (lastMsg) {
      const { body, fromOperator, createdAt } = lastMsg;

      return {
        message: body,
        fromOperator,
        date: createdAt,
      };
    }

    return lastMsg;
  }

  async deleteAllMessages(chatId: string) {
    return this.messageModel.deleteMany({ chatId }).exec();
  }

  getFilteredChats(chatName = '', date: string) {
    const { start, end } = getTimeForFilteringChats(date);

    return this.chatModel
      .find({
        dummyName: { $regex: chatName, $options: 'i' },
        createdAt: {
          $gte: start,
          $lte: end,
        },
      })
      .exec();
  }

  findAllChatsByOperatorIdWithSelect(id: string) {
    return this.chatModel
      .find({
        $or: [
          { operatorId: id, type: OperatorForChat.COACH },
          { assistantId: id, type: OperatorForChat.ASSISTANT },
        ],
      })
      .select('_id dummyName shortKey')
      .exec();
  }

  updateOperatorIdInChat(chatId: string, type, id = '') {
    return this.chatModel
      .findByIdAndUpdate(
        chatId,
        type === OperatorForChat.COACH
          ? {
              operatorId: id,
            }
          : {
              assistantId: id,
            },
        { new: true, useFindAndModify: false },
      )
      .exec();
  }

  findChatByClientNumber(clientNumber) {
    return this.chatModel.findOne({ clientNumber }).exec();
  }
}
