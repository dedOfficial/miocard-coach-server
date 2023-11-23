import {
  ChatBloodPressureDto,
  ChatHeartRateDto,
  ChatWeightDto,
} from 'modules/operator/dto/update-chat.dto';
import {
  EDashboardBlockHighlight,
  EDashboardBlocksTitle,
  EDashboardCategoryTitle,
  EDashboardTitle,
  EDashboardType,
} from '../constants';
import { HabitDocument } from '../../stats/models/habit.model';
import { RecommendationDocument } from '../../stats/models/recommendation.model';
import { TCustomPeriodTemplate } from '../../trackedParameters/helpers/types';
import { DrugDocument } from '../../stats/models/drug.model';

export type TCreateDashboardBlock = {
  blockTitle: EDashboardBlocksTitle;
  firstCategoryTitle: EDashboardCategoryTitle;
  firstValue: number;
  secondCategoryTitle: EDashboardCategoryTitle;
  secondValue: number;
  thirdCategoryTitle?: EDashboardCategoryTitle;
  thirdValue?: number;
};

export type TGetWeightDashboardBlocks = {
  clientWeight: ChatWeightDto;
  lastClientWeight: number;
  averageClientWeightForCurrentMonth: number;
  averageClientWeightForPreviousMonth: number;
  maxWeightOnProjectForPreviousWeek: number;
  maxWeightOnProjectForPreviousMonth: number;
  averageWeightOnProjectForWeek: number;
  averageWeightOnProjectForMonth: number;
};

export type TGetCardioDashboardBlocks = {
  clientHeartRate: ChatHeartRateDto;
  clientBloodPressure: ChatBloodPressureDto;
  averageClientCardioForPreviousWeek: string;
  averageClientCardioForPreviousMonth: string;
  maxCardioOnProjectForPreviousWeek: string;
  maxCardioOnProjectForPreviousMonth: string;
  averageCardioOnProjectForPreviousWeek: string;
  averageCardioOnProjectForPreviousMonth: string;
};

export type TGetCheckinDashboardBlocks = {
  checkinProblemsAmountForWeek: number;
  completedSessionsForCurrentWeek: number;
  maxLimitForWeek: number;
  checkinProblemsAmountForMonth: number;
  completedSessionsForCurrentMonth: number;
  maxLimitForMonth: number;
};

export type TGetMeasurementsDashboardBlocks = {
  measurementsWeeklyNorm: number;
  measurementsMonthlyNorm: number;
  measurementsForCurrentWeek: number;
  measurementsForPreviousWeek: number;
  measurementsForCurrentMonth: number;
  measurementsForPreviousMonth: number;
};

export type THabitsRequests = Promise<{
  currentHabit: {
    id: string;
    name: string;
    repeatability: number;
    limit: number;
  };
  habitsDataForCurrentWeek: HabitDocument[];
  habitsDataForPreviousWeek: HabitDocument[];
  habitsDataForCurrentMonth: HabitDocument[];
  habitsDataForPreviousMonth: HabitDocument[];
}>[];

export interface IDashboardCategory {
  title: EDashboardCategoryTitle;
  value: string | number | null;
  highlighted?: EDashboardBlockHighlight | null;
}

export interface IDashboardBlock {
  title?: EDashboardBlocksTitle;
  categories: IDashboardCategory[];
}

export type TDashboardTemplate = {
  title: EDashboardTitle | string;
  description: string;
  type: EDashboardType;
  blocks: TDashboardTemplateBlock[];
};

export type TCombineDashboardTemplate = {
  title: EDashboardTitle | string;
  description: string;
  type: EDashboardType;
  blocks: TDashboardTemplate[];
};

export type TDashboardTemplateBlock = {
  categories: {
    highlighted: EDashboardBlockHighlight;
    title: EDashboardCategoryTitle;
    value: string | number;
  }[];
  title: EDashboardBlocksTitle;
};

export type TRecommendationsRequests = Promise<{
  currentRecommendation: {
    id: string;
    name: string;
    min: number;
  };
  recommendationsDataForCurrentWeek: RecommendationDocument[];
  recommendationsDataForPreviousWeek: RecommendationDocument[];
  recommendationsDataForCurrentMonth: RecommendationDocument[];
  recommendationsDataForPreviousMonth: RecommendationDocument[];
}>[];

export type TOperatorDashboardTemplateWithMultipleValues = {
  chatName: string;
  data: {
    name: string;
    statistics: TCustomPeriodTemplate[];
  }[];
};

export type TDrugsRequests = Promise<{
  currentDrug: {
    id: string;
    name: string;
  };
  drugsDataForCurrentWeek: DrugDocument[];
  drugsDataForPreviousWeek: DrugDocument[];
  drugsDataForCurrentMonth: DrugDocument[];
  drugsDataForPreviousMonth: DrugDocument[];
}>[];
