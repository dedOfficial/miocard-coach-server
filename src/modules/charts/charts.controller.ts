import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from 'modules/operator/models/chat.model';
import { Cardio, CardioDocument } from 'modules/stats/models/cardio.model';
import { Drug, DrugDocument } from 'modules/stats/models/drug.model';
import { Mood, MoodDocument } from 'modules/stats/models/mood.model';
import { Symptom, SymptomDocument } from 'modules/stats/models/symptom.model';
import { Weight, WeightDocument } from 'modules/stats/models/weight.model';
import { Model } from 'mongoose';

@Controller('charts')
export class ChartsController {
  constructor(
    @InjectModel(Cardio.name) private cardioModel: Model<CardioDocument>,
    @InjectModel(Drug.name) private drugModel: Model<DrugDocument>,
    @InjectModel(Weight.name) private weightModel: Model<WeightDocument>,
    @InjectModel(Mood.name) private moodModel: Model<MoodDocument>,
    @InjectModel(Symptom.name) private symptomModel: Model<SymptomDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  @Get('/:id')
  async getCharts(
    @Param('id') id: string,
    @Query('sd') startDate: string,
    @Query('ed') endDate: string,
  ) {
    const { clientNumber, bloodPressure } = await this.chatModel.findOne({
      shortKey: id,
    });
    const { sys, dia } = bloodPressure.recommended;
    const dates = this.getDates(startDate, endDate);

    // Pressure
    const rawPressure = await this.cardioModel.find({
      clientNumber,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const allSys = [];
    const allDia = [];
    rawPressure.forEach((pressure) => {
      const currentPressure = pressure.pressure.split('/');
      allSys.push(currentPressure[0]);
      allDia.push(currentPressure[1]);
    });
    const averageSys = allSys.reduce((a, b) => a + b, 0) / allSys.length;
    const averageDia = allDia.reduce((a, b) => a + b, 0) / allDia.length;

    const eveningPressure = dates.map((date) => {
      const taken = rawPressure.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date && d.timeofDay === 'evening'
        );
      });
      if (taken) return 'taken';
      return 'none';
    });

    const morningPressure = dates.map((date) => {
      const taken = rawPressure.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date && d.timeofDay === 'morning'
        );
      });
      if (taken) return 'taken';
      return 'none';
    });

    const afternoonPressure = dates.map((date) => {
      const taken = rawPressure.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date &&
          d.timeofDay === 'afternoon'
        );
      });
      if (taken) return 'taken';
      return 'none';
    });

    const nightPressure = dates.map((date) => {
      const taken = rawPressure.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date && d.timeofDay === 'night'
        );
      });
      if (taken) return 'taken';
      return 'none';
    });

    const rawDrugs = await this.drugModel.find({
      clientNumber,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const rawMood = await this.moodModel.find({
      clientNumber,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const rawAha = await this.cardioModel.find({
      clientNumber,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const rawSymptoms = await this.symptomModel.find({
      clientNumber,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const drugs = dates.map((date) => {
      const taken = rawDrugs.some((d: any) => {
        return new Date(d.createdAt).getDate() === date && d.drug === 'Taken';
      });
      if (taken) return 'taken';
      const notTaken = rawDrugs.some((d: any) => {
        return new Date(d.createdAt).getDate() === date && d.drug === 'Taken';
      });
      if (notTaken) return 'not taken';
      return 'none';
    });

    const moods = dates.map((date) => {
      const good = rawMood.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date && d.mood === 'Good mood'
        );
      });
      if (good) return 'good';
      const sad = rawMood.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date && d.mood === 'Sad mood'
        );
      });
      if (sad) return 'sad';
      return 'none';
    });

    const emergency = dates.map((date) => {
      return rawAha.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date &&
          d.pressure.split('/')[0] >= 180
        );
      });
    });

    const high_2 = dates.map((date) => {
      return rawAha.some((d: any) => {
        const systolic = d.pressure.split('/')[0];
        return (
          new Date(d.createdAt).getDate() === date &&
          systolic < 180 &&
          systolic >= 140
        );
      });
    });

    const high_1 = dates.map((date) => {
      return rawAha.some((d: any) => {
        const systolic = d.pressure.split('/')[0];
        return (
          new Date(d.createdAt).getDate() === date &&
          systolic < 140 &&
          systolic >= 130
        );
      });
    });

    const elevated = dates.map((date) => {
      return rawAha.some((d: any) => {
        const systolic = d.pressure.split('/')[0];
        return (
          new Date(d.createdAt).getDate() === date &&
          systolic < 130 &&
          systolic > 120
        );
      });
    });

    const normal = dates.map((date) => {
      return rawAha.some((d: any) => {
        const systolic = d.pressure.split('/')[0];
        return new Date(d.createdAt).getDate() === date && systolic <= 120;
      });
    });

    const cardiac = dates.map((date) => {
      const hasSymptoms = rawSymptoms.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date &&
          d.symptom.cardiovascular.length > 0
        );
      });
      if (hasSymptoms) return 'has';
      return 'none';
    });

    const nonCardiac = dates.map((date) => {
      const hasSymptoms = rawSymptoms.some((d: any) => {
        return (
          new Date(d.createdAt).getDate() === date &&
          !!d.symptom.nonCardiovascular
        );
      });
      if (hasSymptoms) return 'has';
      return 'none';
    });

    return {
      dates,
      overall: {
        start: [sys, dia],
        average: [averageSys || 0, averageDia || 0],
      },
      bpw: {
        morning: morningPressure,
        afternoon: afternoonPressure,
        evening: eveningPressure,
        night: nightPressure,
      },
      drugs,
      cardiac,
      nonCardiac,
      aha: { emergency, high_2, high_1, elevated, normal },
      moods,
    };
  }

  private getDates(start: string, end: string) {
    const arr = [];
    for (
      let dt = new Date(start);
      dt < new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt).getDate());
    }
    return arr;
  }
}
