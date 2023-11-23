import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExcelService } from 'modules/excel/excel.service';
import { OperatorService } from '../operator/operator.service';
import { PdfService } from '../pdf/pdf.service';
import { StatsService } from '../stats/stats.service';
import {
  ExportPdfCardio,
  ExportPdfCheckin,
  ExportPdfDrug,
  ExportPdfFood,
  ExportPdfHabit,
  ExportPdfMood,
  ExportPdfSymptom,
  ExportPdfWalkedDistance,
  ExportPdfWeight,
  ExportPdfRecommendation,
} from './helpers/types';
import { getResultStatByPeriod } from './helpers';
import { EStatName } from '../../utils/stats/types';
import JSZip = require('jszip');
import { CheckinTranscript } from './helpers/constants';
import * as moment from 'moment';
import { Chat, ChatDocument } from 'modules/operator/models/chat.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Controller('export')
export class ExportController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly operatorService: OperatorService,
    private readonly statsService: StatsService,
    private readonly excelService: ExcelService,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  @Get(':id')
  async exportHistory(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('sd') startDate: string,
    @Query('ed') endDate: string,
  ) {
    const chatInfo = await this.operatorService.getChatInfo(id);
    const chatHistory = await this.operatorService.getChatHistory(id);
    const resultChatHistory = chatHistory.filter((a: any) => {
      const date = moment(a.createdAt);
      return (
        moment(date).isSameOrAfter(moment(startDate).startOf('day')) &&
        moment(date).isSameOrBefore(moment(endDate).endOf('day'))
      );
    });

    const buffer = await this.pdfService.generate(
      chatInfo.dummyName,
      resultChatHistory,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=chat_history_${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  /** @Deprecated. */
  @Get('stats/:id')
  async exportStats(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('sd') startDate: string,
    @Query('ed') endDate: string,
  ): Promise<void> {
    const chatInfo = await this.operatorService.getChatInfo(id);

    // TODO remove in this pilot
    /*const food = await this.statsService.getFood({
      clientNumber: chatInfo.clientNumber,
    });
    const resultFood: Array<ExportPdfFood> = [];
    getResultStatByPeriod(
      food,
      resultFood,
      chatInfo.clientNumber,
      EStatName.foodModel,
      startDate,
      endDate,
    );*/

    const recommendations = await this.statsService.getRecommendationsVerbose({
      clientNumber: chatInfo.clientNumber,
    });

    const resultRecommendations: Array<ExportPdfRecommendation> = [];
    getResultStatByPeriod(
      recommendations,
      resultRecommendations,
      chatInfo.clientNumber,
      EStatName.recommendationModel,
      startDate,
      endDate,
    );

    const drug = await this.statsService.getDrug({
      clientNumber: chatInfo.clientNumber,
    });
    const resultDrug: Array<ExportPdfDrug> = [];
    getResultStatByPeriod(
      drug,
      resultDrug,
      chatInfo.clientNumber,
      EStatName.drugModel,
      startDate,
      endDate,
    );

    const symptom = await this.statsService.getSymptom({
      clientNumber: chatInfo.clientNumber,
    });
    const resultSymptom: Array<ExportPdfSymptom> = [];
    getResultStatByPeriod(
      symptom,
      resultSymptom,
      chatInfo.clientNumber,
      EStatName.symptomModel,
      startDate,
      endDate,
    );

    const weight = await this.statsService.getWeight({
      clientNumber: chatInfo.clientNumber,
    });
    const resultWeight: Array<ExportPdfWeight> = [];
    getResultStatByPeriod(
      weight,
      resultWeight,
      chatInfo.clientNumber,
      EStatName.weightModel,
      startDate,
      endDate,
    );

    const cardio = await this.statsService.getCardio({
      clientNumber: chatInfo.clientNumber,
    });
    const resultCardio: Array<ExportPdfCardio> = [];
    getResultStatByPeriod(
      cardio,
      resultCardio,
      chatInfo.clientNumber,
      EStatName.cardioModel,
      startDate,
      endDate,
    );

    const mood = await this.statsService.getMood({
      clientNumber: chatInfo.clientNumber,
    });
    const resultMood: Array<ExportPdfMood> = [];
    getResultStatByPeriod(
      mood,
      resultMood,
      chatInfo.clientNumber,
      EStatName.moodModel,
      startDate,
      endDate,
    );
    // TODO remove in this pilot
    /*const walkedDistance = await this.statsService.getWalkedDistance({
      clientNumber: chatInfo.clientNumber,
    });
    const resultDistance: Array<ExportPdfWalkedDistance> = [];
    getResultStatByPeriod(
      walkedDistance,
      resultDistance,
      chatInfo.clientNumber,
      EStatName.walkedDistanceModel,
      startDate,
      endDate,
    );*/

    const habit = await this.statsService.getHabits({
      clientNumber: chatInfo.clientNumber,
    });
    const resultHabitWithHabitId: Array<ExportPdfHabit> = [];
    getResultStatByPeriod(
      habit,
      resultHabitWithHabitId,
      chatInfo.clientNumber,
      EStatName.habitModel,
      startDate,
      endDate,
    );
    const resultHabit = resultHabitWithHabitId.map((item) => {
      if (item.habitId) {
        item.habit = chatInfo.habits.find(
          (habit) => habit.id === item.habitId,
        ).name;
      }
      return item;
    });

    const checkin = await this.statsService.getCheckins({
      clientNumber: chatInfo.clientNumber,
    });
    const resultCheckinWithoutTranscript: Array<ExportPdfCheckin> = [];
    getResultStatByPeriod(
      checkin,
      resultCheckinWithoutTranscript,
      chatInfo.clientNumber,
      EStatName.checkinModel,
      startDate,
      endDate,
    );
    const resultCheckin = resultCheckinWithoutTranscript.map((item) => {
      if (Array.isArray(item.checkin)) {
        item.checkin = item.checkin.map(
          (checkin) => CheckinTranscript[checkin],
        );
      }
      return item;
    });
    // TODO remove in this pilot
    const statsArray = {
      /*food: resultFood,*/
      drug: resultDrug,
      symptom: resultSymptom,
      weight: resultWeight,
      cardio: resultCardio,
      mood: resultMood,
      /* walkedDistance: resultDistance,*/
      habit: resultHabit,
      checkin: resultCheckin,
      recommendations: resultRecommendations,
    };

    const buffer = await this.pdfService.generateStats({
      id: chatInfo.dummyName,
      stats: statsArray,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=client_stats_${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('stats/excel/:id')
  async exportStatsExcel(@Res() res: Response, @Param('id') id: string) {
    const chatInfo = await this.operatorService.getChatInfo(id);
    const food = await this.statsService.getFood({
      clientNumber: chatInfo.clientNumber,
    });
    const cardio = await this.statsService.getCardio({
      clientNumber: chatInfo.clientNumber,
    });

    const drug = await this.statsService.getDrug({
      clientNumber: chatInfo.clientNumber,
    });
    const symptom = await this.statsService.getSymptom({
      clientNumber: chatInfo.clientNumber,
    });
    const weight = await this.statsService.getWeight({
      clientNumber: chatInfo.clientNumber,
    });
    const mood = await this.statsService.getMood({
      clientNumber: chatInfo.clientNumber,
    });
    const recommendations = await this.statsService.getRecommendations({
      clientNumber: chatInfo.clientNumber,
    });
    const walkedDistance = await this.statsService.getWalkedDistance({
      clientNumber: chatInfo.clientNumber,
    });
    const habitWithoutName = await this.statsService.getHabits({
      clientNumber: chatInfo.clientNumber,
    });
    const habit = habitWithoutName.map((item) => {
      item.habitId = chatInfo.habits.find(
        (habit) => habit.id === item.habitId,
      ).name;
      return item;
    });
    const checkin = await this.statsService.getCheckins({
      clientNumber: chatInfo.clientNumber,
    });

    const buffer = this.excelService.exportStatsExcel(chatInfo.dummyName, {
      food,
      cardio,
      drug,
      symptom,
      weight,
      mood,
      recommendations,
      walkedDistance,
      habit,
      checkin,
    });

    const zip = new JSZip();
    for (const [key, value] of Object.entries(buffer)) {
      zip.file(`${key}.csv`, value);
    }
    const zipArchive = await zip.generateAsync({ type: 'nodebuffer' });

    const currentTimestamp = new Date().getTime();

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=stats_${id}__${currentTimestamp}.zip`,
    });

    res.end(zipArchive);
  }
}
