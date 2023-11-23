import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import {
  adjectives,
  animals,
  colors,
  Config,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import keyBy = require('lodash/keyBy');

import { ChatService } from '../chat/chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateChatDto, UpdateChatStatusDto } from './dto/update-chat.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { Chat, ChatDocument } from './models/chat.model';
import { Operator, OperatorDocument } from './models/operator.model';
import { OperatorForChat } from './enums/operators-for-chat.enum';
import { EStatsModels } from '../../utils/stats/types';
import { StatsService } from '../stats/stats.service';
import { KitsService } from '../kits/kits.service';
import { TrackedParametersService } from '../trackedParameters/trackedParameters.service';
import omit = require('lodash/omit');
import * as bcrypt from 'bcrypt';
import { Dictionary } from 'types/global';

@Injectable()
export class OperatorService {
  constructor(
    @InjectModel(Operator.name) private operatorModel: Model<OperatorDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly chatService: ChatService,
    private readonly statsService: StatsService,
    private readonly kitsService: KitsService,
    private readonly trackedParametersService: TrackedParametersService,
  ) {}

  async createChat(createChatDto: CreateChatDto) {
    const coachChatKey = nanoid(10);
    const assistantChatKey = nanoid(10);

    const dummyConfig: Config = {
      dictionaries: [adjectives, colors, animals],
      separator: ' ',
      length: 2,
      style: 'capital',
    };
    const lastChat = await this.chatModel.findOne(
      {},
      {},
      { sort: { createdAt: -1 } },
    );
    const nextSequenceNumber = (lastChat?.sequenceNumber || 0) + 1;
    const dummyName = uniqueNamesGenerator(dummyConfig);
    const coachChat = new this.chatModel({
      ...createChatDto,
      shortKey: coachChatKey,
      twinChatKey: assistantChatKey,
      type: OperatorForChat.COACH,
      sequenceNumber: nextSequenceNumber,
      dummyName: `C${nextSequenceNumber} ${dummyName}`,
    });
    const assistantChat = new this.chatModel({
      ...createChatDto,
      shortKey: assistantChatKey,
      twinChatKey: coachChatKey,
      type: OperatorForChat.ASSISTANT,
      sequenceNumber: nextSequenceNumber,
      dummyName: `A${nextSequenceNumber} ${dummyName}`,
    });
    const newCoachChat = await coachChat.save();
    await assistantChat.save();

    return newCoachChat;
  }

  async deleteChat(shortKey: string) {
    const mongoSession = await this.connection.startSession();
    mongoSession.startTransaction();

    try {
      const {
        clientNumber,
        kit,
        twinChatKey,
        _id,
      } = await this.chatModel.findOne({ shortKey });
      const secondChat = await this.findChatByKey(twinChatKey);

      await this.chatModel.deleteOne({ shortKey }).exec();
      await this.chatModel.deleteOne({ shortKey: twinChatKey }).exec();

      await this.trackedParametersService.deleteDataTrackedParameters(shortKey);
      await this.trackedParametersService.deleteDataTrackedParameters(
        twinChatKey,
      );

      const requests = Object.values(EStatsModels).map((model) =>
        this.statsService.deleteStatsByChat(clientNumber, model),
      );

      await Promise.all(
        requests.map(async (request) => {
          return await request;
        }),
      )
        .then((values) => {
          return values;
        })
        .catch(() => {
          throw new NotFoundException();
        });
      await this.chatService.deleteAllMessages(shortKey);
      if (kit?.id) {
        await this.kitsService.deleteChatFromKit(kit.id, _id);
      }
      if (secondChat.kit?.id) {
        await this.kitsService.deleteChatFromKit(
          secondChat.kit.id,
          secondChat._id,
        );
      }
      await mongoSession.commitTransaction();
    } catch (error) {
      await mongoSession.abortTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      mongoSession.endSession();
    }
  }

  async getChatHistory(chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  async getInitialChatHistory(chatId: string) {
    return this.chatService.getInitialMessages(chatId);
  }

  async getPartOfChatHistory(chatId: string, count: string) {
    return this.chatService.getPartOfMessages(chatId, count);
  }

  async getChatHistoryPartly(chatId: string, count: string) {
    return this.chatService.getChatHistoryPartly(chatId, count);
  }

  async findOperator(email: string) {
    return this.operatorModel.find({ email }).exec();
  }

  async createOperator(createOperatorDto: CreateOperatorDto) {
    createOperatorDto.email = createOperatorDto.email.toLowerCase();
    const createdOperator = new this.operatorModel(createOperatorDto);
    return createdOperator.save();
  }

  async getOperatorId(email: string) {
    return this.operatorModel.findOne({ email }).select('_id').exec();
  }

  async deleteOperator(email: string) {
    return this.operatorModel.deleteOne({ email }).exec();
  }

  updateOperator(body: UpdateOperatorDto) {
    return this.operatorModel.findByIdAndUpdate(body.id, omit(body, 'id'), {
      new: true,
      useFindAndModify: false,
    });
  }

  async addAvatar(id: string) {
    return await this.operatorModel.findByIdAndUpdate(
      id,
      { avatar: `${id}.webp` },
      { new: true, useFindAndModify: false },
    );
  }

  async getAllCoaches() {
    return this.operatorModel.find({ type: 'coach' }).exec();
  }

  async getAllAssistants() {
    return this.operatorModel.find({ type: 'assistant' }).exec();
  }

  getAllChats() {
    return this.chatModel.find({}).exec();
  }

  async getAllChatsWithUnreadMessages() {
    const chats = await this.chatModel.find({}).exec();
    const chatResponse: any = [];
    for (const chat of chats) {
      const unreadMessages = await this.chatService.getLastMessagesCountForChat(
        chat.shortKey,
      );

      chatResponse.push(Object.assign({}, chat.toObject(), { unreadMessages }));
    }

    return chatResponse;
  }

  getAllActiveChats() {
    return this.chatModel.find({ active: true }).exec();
  }

  getAllActiveChatsByOperatorOrAssistant(type: ChatDocument['type']) {
    return this.chatModel.find({ active: true, type }).exec();
  }

  getAllActiveChatsGroupByOperatorAndAssistant() {
    return this.chatModel
      .aggregate([
        {
          $match: { active: true },
        },
        {
          $group: {
            _id: '$type',
            chats: { $push: '$$ROOT' },
          },
        },
      ])
      .exec();
  }

  findByIdAndUpdate(id: string, dto: Omit<UpdateChatDto, 'id'>) {
    return this.chatModel
      .findByIdAndUpdate(id, dto, {
        new: true,
        useFindAndModify: false,
      })
      .exec();
  }

  findByIdAndUpdateChatStatus({ id, active }: UpdateChatStatusDto) {
    return this.chatModel
      .findByIdAndUpdate(
        id,
        { active },
        {
          new: true,
          useFindAndModify: false,
        },
      )
      .exec();
  }

  async getChatId(phone: string) {
    return this.chatModel.findOne(
      { clientNumber: phone },
      { shortKey: true, _id: false },
    );
  }

  async getChatInfo(chatId: string) {
    return this.chatModel.findOne({ shortKey: chatId }).exec();
  }

  async getPublicInfo(chatId: string) {
    const currentChat = await this.chatModel
      .findOne({ shortKey: chatId })
      .exec();

    const currentOperator = await this.operatorModel
      .findById(currentChat.operatorId)
      .exec();

    return {
      operator: currentOperator.name,
      avatar: currentOperator.avatar,
    };
  }

  findAllChatsForClient(chat: { coachId: string; assistantId: string }) {
    return this.chatModel
      .find({ operatorId: chat.coachId, assistantId: chat.assistantId })
      .exec();
  }

  findOperatorByEmail(email: string) {
    return this.operatorModel.findOne({ email }).exec();
  }

  findChatById(chatId: string) {
    return this.chatModel.findById(chatId).exec();
  }

  findChatByClientNumber(phone: string) {
    return this.chatModel.find({ clientNumber: phone }).exec();
  }

  findChatByKey(key: string) {
    return this.chatModel.findOne({ shortKey: key }).exec();
  }

  findOperatorById(operatorId: string) {
    return this.operatorModel.findById(operatorId).exec();
  }

  findOperatorWithSelect(operatorId: string) {
    return this.operatorModel
      .findById(operatorId)
      .select('_id name email basicInfo avatar phoneNumber type')
      .exec();
  }

  findAllCoaches() {
    return this.operatorModel
      .find({
        type: OperatorForChat.COACH,
      })
      .exec();
  }

  findAllAssistants() {
    return this.operatorModel
      .find({
        type: OperatorForChat.ASSISTANT,
      })
      .exec();
  }

  async updateOperatorPassword(id: string, newPassword: string) {
    const operator = await this.operatorModel.findById(id).exec();
    await this.operatorModel.replaceOne(
      { _id: id },
      { ...operator.toObject(), password: bcrypt.hashSync(newPassword, 10) },
    );
  }

  findAllOperators() {
    return this.operatorModel.find({}).exec();
  }

  // return all operators and assistants
  async findAllOperatorsAndReturnById() {
    const operators = await this.operatorModel.find({}).exec();

    return keyBy(operators, '_id') as Dictionary<OperatorDocument>;
  }

  findAllChatsByOperatorId(operatorId: string) {
    return this.chatModel.find({ operatorId }).exec();
  }

  async findAllActiveChatsById(id: string): Promise<ChatDocument[]> {
    return await this.chatModel
      .find({
        $or: [
          { operatorId: id, type: OperatorForChat.COACH },
          { assistantId: id, type: OperatorForChat.ASSISTANT },
        ],
        active: true,
      })
      .exec();
  }

  async findAllChatsByCoachOrAssistantId(id: string): Promise<ChatDocument[]> {
    const chats = await this.chatModel
      .find({
        $or: [
          { operatorId: id, type: OperatorForChat.COACH },
          { assistantId: id, type: OperatorForChat.ASSISTANT },
        ],
      })
      .exec();

    const chatResponse: any = [];
    for (const chat of chats) {
      const unreadMessages = await this.chatService.getLastMessagesCountForChat(
        chat.shortKey,
      );

      chatResponse.push(Object.assign({}, chat.toObject(), { unreadMessages }));
    }

    return chatResponse;
  }
}
