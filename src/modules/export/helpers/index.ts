import * as moment from 'moment';
import {
  ExportPdfCardio,
  ExportPdfCheckin,
  ExportPdfDrug,
  ExportPdfFood,
  ExportPdfHabit,
  ExportPdfMood,
  ExportPdfRecommendation,
  ExportPdfSymptom,
  ExportPdfWalkedDistance,
  ExportPdfWeight,
  ResultPdfStat,
} from './types';
import { EStatName, TStat } from '../../../utils/stats/types';
import { FoodDocument } from '../../stats/models/food.model';
import { DrugDocument } from '../../stats/models/drug.model';
import { SymptomDocument } from '../../stats/models/symptom.model';
import { WeightDocument } from '../../stats/models/weight.model';
import { CardioDocument } from '../../stats/models/cardio.model';
import { MoodDocument } from '../../stats/models/mood.model';
import { WalkedDistanceDocument } from '../../stats/models/walked-distance.model';
import { HabitDocument } from '../../stats/models/habit.model';
import { CheckinDocument } from '../../stats/models/checkin.model';
import { RecommendationDocument } from 'modules/stats/models/recommendation.model';

export const getResultStatByPeriod = (
  statArray: Array<TStat>,
  resultArray: Array<ResultPdfStat>,
  clientNumber: string,
  statType: EStatName,
  startDate: string,
  endDate: string,
) => {
  const statStartDate = moment(startDate).subtract('1', 'day');
  const statEndDate = moment(endDate);
  while (statStartDate.valueOf() !== statEndDate.valueOf()) {
    statStartDate.add('1', 'day');
    resultArray.push({
      clientNumber,
      day: statStartDate.format('DD-MM-YYYY'),
      time: '',
    });
  }
  const newItems: Array<ResultPdfStat> = [];
  statArray.forEach((stat) => {
    resultArray.forEach((item) => {
      if (item.day === stat.day && item.time === '') {
        item.time = stat.time;
        currentStat(item, stat, statType);
        return item;
      }
      if (item.day === stat.day && item.time !== '') {
        const newItem: ResultPdfStat = {
          clientNumber,
          day: stat.day,
          time: stat.time,
        };
        currentStat(newItem, stat, statType);
        newItems.push(newItem);
      }
    });
  });
  return resultArray.push(...newItems);
};

const currentStat = (item: ResultPdfStat, stat: TStat, statType: EStatName) => {
  switch (statType) {
    case EStatName.recommendationModel:
      (item as ExportPdfRecommendation).repeatability = stat.isReceived
        ? (stat as RecommendationDocument).repeatability
        : stat.notReceivedReason;
      (item as any).recommendationTitle = (stat as any).recommendationTitle[0];
      break;
    case EStatName.foodModel:
      (item as ExportPdfFood).food = stat.isReceived
        ? (stat as FoodDocument).food
        : stat.notReceivedReason;
      break;
    case EStatName.drugModel:
      (item as ExportPdfDrug).drug = stat.isReceived
        ? (stat as DrugDocument).drug
        : stat.notReceivedReason;
      break;
    case EStatName.symptomModel:
      (item as ExportPdfSymptom).symptom = stat.isReceived
        ? (stat as SymptomDocument).symptom
        : stat.notReceivedReason;
      break;
    case EStatName.weightModel:
      (item as ExportPdfWeight).weight = stat.isReceived
        ? (stat as WeightDocument).weight
        : stat.notReceivedReason;
      break;
    case EStatName.cardioModel:
      if (stat.isReceived) {
        (item as ExportPdfCardio).pressure = (stat as CardioDocument).pressure;
        (item as ExportPdfCardio).pulse = (stat as CardioDocument).pulse;
        (item as ExportPdfCardio).timeOfDay = (stat as CardioDocument).timeOfDay;
      } else {
        (item as ExportPdfCardio).pressure = (stat as CardioDocument).notReceivedReason;
        (item as ExportPdfCardio).pulse = (stat as CardioDocument).notReceivedReason;
      }
      break;
    case EStatName.moodModel:
      (item as ExportPdfMood).mood = stat.isReceived
        ? (stat as MoodDocument).mood
        : stat.notReceivedReason;
      break;
    case EStatName.walkedDistanceModel:
      (item as ExportPdfWalkedDistance).walkedDistance = stat.isReceived
        ? (stat as WalkedDistanceDocument).walkedDistance
        : stat.notReceivedReason;
      break;
    case EStatName.habitModel:
      if (stat.isReceived) {
        (item as ExportPdfHabit).habitId = (stat as HabitDocument).habitId;
        (item as ExportPdfHabit).repeatability = (stat as HabitDocument).repeatability;
      } else {
        (item as ExportPdfHabit).habit = stat.notReceivedReason;
      }
      break;
    case EStatName.checkinModel:
      (item as ExportPdfCheckin).checkin = stat.isReceived
        ? (stat as CheckinDocument).checkinCheckboxes
        : stat.notReceivedReason;
      break;
  }
};
