import { CardioDocument } from 'modules/stats/models/cardio.model';
import { DrugDocument } from 'modules/stats/models/drug.model';
import { FoodDocument } from 'modules/stats/models/food.model';
import { HabitDocument } from 'modules/stats/models/habit.model';
import { MoodDocument } from 'modules/stats/models/mood.model';
import { NotesDocument } from 'modules/stats/models/notes.model';
import { SymptomDocument } from 'modules/stats/models/symptom.model';
import { WalkedDistanceDocument } from 'modules/stats/models/walked-distance.model';
import { WeightDocument } from 'modules/stats/models/weight.model';
import { CheckinDocument } from 'modules/stats/models/checkin.model';
import { TGetPressureAndPulseFromString } from 'utils/common/types';
import { RecommendationDocument } from '../../modules/stats/models/recommendation.model';

export type TStat =
  | CardioDocument
  | FoodDocument
  | DrugDocument
  | SymptomDocument
  | WeightDocument
  | NotesDocument
  | MoodDocument
  | WalkedDistanceDocument
  | HabitDocument
  | CheckinDocument
  | RecommendationDocument;

type TRemoveStat =
  | TStat
  | ({
      ok?: number;
      n?: number;
    } & {
      deletedCount?: number;
    });

export type TStatWithFillingSuccess = {
  stat: TRemoveStat;
  fillingSuccess: Array<{ date: string; value: number; total: number }>;
};

export enum EStatsDBKeyName {
  WEIGHT = 'weight',
  PRESSURE = 'pressure',
  PULSE = 'pulse',
  FOOD = 'food',
  HABIT = 'repeatability',
  RECOMMENDATION = 'recommendation',
  DRUG = 'drug',
  SYMPTOM = 'symptom',
  WALKED_DISTANCE = 'walkedDistance',
  MOOD = 'mood',
  NOTES = 'notes',
  CHECKIN = 'checkinCheckboxes',
  RECOMMENDATION_TO_FOLLOW = 'repeatability',
}

export enum EStatsModels {
  WEIGHT_MODEL = 'weightModel',
  CARDIO_MODEL = 'cardioModel',
  FOOD_MODEL = 'foodModel',
  HABIT_MODEL = 'habitModel',
  RECOMMENDATION_MODEL = 'recommendationModel',
  DRUG_MODEL = 'drugModel',
  SYMPTOM_MODEL = 'symptomModel',
  WALKED_DISTANCE_MODEL = 'walkedDistanceModel',
  MOOD_MODEL = 'moodModel',
  NOTES_MODEL = 'notesModel',
  CHECKIN_MODEL = 'checkinModel',
}

export enum EStatName {
  cardioModel = 'cardio',
  checkinModel = 'checkins',
  foodModel = 'meals',
  habitModel = 'habits',
  recommendationModel = 'recommendations',
  drugModel = 'drugs',
  symptomModel = 'symptoms',
  walkedDistanceModel = 'walkedDistances',
  weightModel = 'weight',
  moodModel = 'mood',
  notesModel = 'notes',
}

export type TGetAverageCardioValueForPeriod = Array<CardioDocument>;

export type IGetAverageCardioValueForPeriod = TGetPressureAndPulseFromString;
