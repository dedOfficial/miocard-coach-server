import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Cardio, CardioDocument } from 'modules/stats/models/cardio.model';
import { Chat, ChatDocument } from 'modules/operator/models/chat.model';
import { Model } from 'mongoose';

@Injectable()
export class CalculateBpCron {
  constructor(
    @InjectModel(Cardio.name) private cardioModel: Model<CardioDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  averageCachedCardio = { sys: 120, dia: 70, maxSys: 0, maxDia: 0 };
  averageCachedTodayCardio = { sys: 120, dia: 70, maxSys: 0, maxDia: 0 };
  averageCachedCardioPerUser: Record<string, { sys: number; dia: number }> = {};
  hasCachedPerUser = false;

  /** Calculates today average values for the whole project. */
  @Cron(CronExpression.EVERY_HOUR)
  async calculateTodayBp() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const allCardios = await this.cardioModel
      .find({ measuredAt: { $gte: today } })
      .exec();
    const cardiosCount = allCardios.length;

    // Max values for project
    const maxSys = allCardios.reduce((acc, cardio) => {
      const sys = parseInt(cardio.pressure.split('/')[0], 10);
      return sys > acc ? sys : acc;
    }, 0);
    const maxDia = allCardios.reduce((acc, cardio) => {
      const dia = parseInt(cardio.pressure.split('/')[0], 10);
      return dia > acc ? dia : acc;
    }, 0);

    // Average values for project
    const sumSys = allCardios.reduce((acc, cardio) => {
      return acc + parseInt(cardio.pressure.split('/')[0], 10);
    }, 0);
    const sumDia = allCardios.reduce((acc, cardio) => {
      return acc + parseInt(cardio.pressure.split('/')[1], 10);
    }, 0);

    const averageSys = Math.round(sumSys / cardiosCount);
    const averageDia = Math.round(sumDia / cardiosCount);

    this.averageCachedTodayCardio = {
      sys: averageSys,
      dia: averageDia,
      maxSys: maxSys,
      maxDia: maxDia,
    };
  }

  /** Calculates all time average values for the whole project. */
  @Cron(CronExpression.EVERY_HOUR)
  async calculateBp() {
    const allCardios = await this.cardioModel.find().exec();
    const cardiosCount = allCardios.length;

    // Max values for project
    const maxSys = allCardios.reduce((acc, cardio) => {
      const sys = parseInt(cardio.pressure.split('/')[0], 10);
      return sys > acc ? sys : acc;
    }, 0);
    const maxDia = allCardios.reduce((acc, cardio) => {
      const dia = parseInt(cardio.pressure.split('/')[0], 10);
      return dia > acc ? dia : acc;
    }, 0);

    // Average values for project
    const sumSys = allCardios.reduce((acc, cardio) => {
      return acc + parseInt(cardio.pressure.split('/')[0], 10);
    }, 0);
    const sumDia = allCardios.reduce((acc, cardio) => {
      return acc + parseInt(cardio.pressure.split('/')[1], 10);
    }, 0);

    const averageSys = Math.round(sumSys / cardiosCount);
    const averageDia = Math.round(sumDia / cardiosCount);

    this.averageCachedCardio = {
      sys: averageSys,
      dia: averageDia,
      maxSys: maxSys,
      maxDia: maxDia,
    };
  }

  /** Calculates all time average values per user. */
  @Cron(CronExpression.EVERY_HOUR)
  async calculateBpPerUser() {
    this.hasCachedPerUser = true;

    const allChats = await this.chatModel.find().exec();
    const allCardios = await this.cardioModel.find().exec();

    allChats.forEach((chat) => {
      const cardios = allCardios.filter((cardio) => {
        return cardio.clientNumber === chat.clientNumber;
      });

      const sumSys = cardios.reduce((acc, cardio) => {
        return acc + parseInt(cardio.pressure.split('/')[0], 10);
      }, 0);
      const sumDia = cardios.reduce((acc, cardio) => {
        return acc + parseInt(cardio.pressure.split('/')[1], 10);
      }, 0);

      const averageSys = Math.round(sumSys / cardios.length);
      const averageDia = Math.round(sumDia / cardios.length);

      this.averageCachedCardioPerUser[chat.clientNumber] = {
        sys: averageSys,
        dia: averageDia,
      };
    });
  }
}
