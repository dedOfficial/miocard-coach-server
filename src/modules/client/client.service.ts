import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OperatorForChat } from 'modules/operator/enums/operators-for-chat.enum';
import { Chat, ChatDocument } from 'modules/operator/models/chat.model';
import {
  Message,
  MessageDocument,
} from 'modules/operator/models/message.model';
import {
  Operator,
  OperatorDocument,
} from 'modules/operator/models/operator.model';
import { Cardio, CardioDocument } from 'modules/stats/models/cardio.model';
import { Model } from 'mongoose';
import { CalculateBpCron } from './calculate-bp.cron';
import { ClientChats } from './interfaces/client-chats.interface';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Operator.name) private operatorModel: Model<OperatorDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Cardio.name) private cardioModel: Model<CardioDocument>,
    private readonly calculateBpCron: CalculateBpCron,
  ) {}

  async getClientResults(phone: string): Promise<any> {
    const chat = await this.chatModel.findOne({ clientNumber: phone });

    if (!chat) {
      throw new UnauthorizedException('You have no chats yet.');
    }

    const { sys, dia } = chat.bloodPressure.recommended;

    // Get computed values for whole project
    const recommendedPulse =
      chat.heartRate.recommended === 0 ? 70 : chat.heartRate.recommended;

    // Last measurement
    const lastCardio = await this.cardioModel
      .findOne({ clientNumber: phone, isReceived: true })
      .sort({ measuredAt: -1 });

    // All measurements for 30 days
    const countCardio = (
      await this.cardioModel
        .find({
          measuredAt: {
            $gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
          },
          clientNumber: phone,
          isReceived: true,
        })
        .distinct('day')
    ).length;

    // Missed measurements
    const missedCardio = (
      await this.cardioModel
        .find({
          measuredAt: {
            $gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
          },
          clientNumber: phone,
          isReceived: false,
        })
        .distinct('day')
    ).length;

    // Generate synopsis for current user
    let synopsis = '';
    if (lastCardio) {
      const [currentSys, currentDia] = lastCardio.pressure.split('/');

      const currentSysParsed = parseInt(currentSys, 10);
      const currentDiaParsed = parseInt(currentDia, 10);

      if (currentSysParsed <= this.calculateBpCron.averageCachedCardio.sys) {
        synopsis +=
          'Your systolic pressure is lower than the project average, ';
      } else if (
        this.calculateBpCron.averageCachedCardioPerUser[phone] &&
        currentSysParsed <=
          this.calculateBpCron.averageCachedCardioPerUser[phone].sys
      ) {
        synopsis += 'Your systolic pressure is lower than your average, ';
      } else if (
        currentSysParsed <= this.calculateBpCron.averageCachedCardio.maxSys
      ) {
        synopsis += 'Your systolic pressure is lower than project maximum, ';
      } else if (
        currentSysParsed <= this.calculateBpCron.averageCachedTodayCardio.sys
      ) {
        synopsis += 'Your systolic pressure is lower than today average, ';
      } else if (
        currentSysParsed <= this.calculateBpCron.averageCachedTodayCardio.maxSys
      ) {
        synopsis += 'Your systolic pressure is lower than today maximum, ';
      } else {
        synopsis += 'Your systolic pressure is lower than your maximum, ';
      }

      if (currentDiaParsed <= this.calculateBpCron.averageCachedCardio.dia) {
        synopsis += 'diastolic pressure is lower than the project average.';
      } else if (
        this.calculateBpCron.averageCachedCardioPerUser[phone].dia &&
        currentDiaParsed <=
          this.calculateBpCron.averageCachedCardioPerUser[phone].dia
      ) {
        synopsis += 'diastolic pressure is lower than your average.';
      } else if (
        currentDiaParsed <= this.calculateBpCron.averageCachedCardio.maxDia
      ) {
        synopsis += 'diastolic pressure is lower than project maximum.';
      } else if (
        currentDiaParsed <= this.calculateBpCron.averageCachedTodayCardio.dia
      ) {
        synopsis += 'diastolic pressure is lower than today average.';
      } else if (
        currentDiaParsed <= this.calculateBpCron.averageCachedTodayCardio.maxDia
      ) {
        synopsis += 'diastolic pressure is lower than today maximum.';
      } else {
        synopsis += 'diastolic pressure is lower than you maximum.';
      }
    }

    return {
      lastMeasurement: lastCardio
        ? `${lastCardio.pressure} ${lastCardio.pulse}`
        : `No data.`,
      recommended:
        sys === 0 && dia === 0
          ? 'Not added.'
          : `${sys}/${dia} ${recommendedPulse}`,
      measured: countCardio,
      missed: missedCardio,
      progress: Math.min(countCardio, 30),
      synopsis: lastCardio
        ? synopsis
        : 'You have not any added measurements yet. Ask your coach to add your latest blood pressure measurement.',
    };
  }

  async getChatsForUser(phone: string): Promise<ClientChats[]> {
    const resultChats: ClientChats[] = [];

    // Coach chat
    const coachChat = await this.chatModel.findOne({
      clientNumber: phone,
      type: OperatorForChat.COACH,
    });

    if (coachChat) {
      const coach = await this.operatorModel.findOne({
        _id: coachChat.operatorId,
      });

      const coachLastMessage = await this.messageModel
        .findOne({
          chatId: coachChat.shortKey,
        })
        .sort({ createdAt: -1 });

      resultChats.push({
        operatorName: coach.name,
        avatarUrl: coach.avatar || null,
        type: OperatorForChat.COACH,
        chatKey: coachChat.shortKey,
        lastMessage: coachLastMessage ? coachLastMessage.body : null,
      });
    }

    // Assistant chat
    const assistantChat = await this.chatModel.findOne({
      clientNumber: phone,
      type: OperatorForChat.ASSISTANT,
    });

    if (assistantChat && assistantChat.assistantId) {
      const assistant = await this.operatorModel.findOne({
        _id: assistantChat.assistantId,
      });

      const assistantLastMessage = await this.messageModel
        .findOne({
          chatId: assistantChat.shortKey,
        })
        .sort({ createdAt: -1 });

      resultChats.push({
        operatorName: assistant.name,
        avatarUrl: assistant.avatar || null,
        type: OperatorForChat.ASSISTANT,
        chatKey: assistantChat.shortKey,
        lastMessage: assistantLastMessage ? assistantLastMessage.body : null,
      });
    }

    if (!coachChat && !assistantChat) {
      throw new UnauthorizedException('You have no chats yet.');
    }

    return resultChats;
  }
}
