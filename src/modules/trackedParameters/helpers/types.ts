import { CardioDocument } from 'modules/stats/models/cardio.model';
import { EPeriodOfTime } from 'utils/common';
import { TDefaultPeriodTemplate } from 'utils/common/types';
import { EDashboardBlockHighlight } from '../../dashboard/constants';
import { ChatDocument } from '../../operator/models/chat.model';

export type TOneUniqueStatByChat = {
  [key: string]: CardioDocument;
};

export type TTrackedParameterStats = {
  name: string;
  statistics: TDefaultPeriodTemplate[];
};

export type TCheckinProblemPeriod = {
  period: EPeriodOfTime;
  problems: number;
  completedSession: number;
  maxLimit: number;
  highlight: EDashboardBlockHighlight;
};

export type TCheckinProblems = {
  dummyName: string;
  [EPeriodOfTime.WEEK]: TCheckinProblemPeriod;
  [EPeriodOfTime.MONTH]: TCheckinProblemPeriod;
};

export type TTrackedParameterByCoach = {
  name: string;
  operatorId: string;
  statistics: TDefaultPeriodTemplate[] | TCustomPeriodTemplate[];
};

export type TCustomPeriodTemplate = {
  period: EPeriodOfTime;
  previous: number;
  current: number;
  minNorm?: number;
  maxLimit?: number;
  highlight: EDashboardBlockHighlight;
};

export type TFillingSuccessValuesChatByPeriod = {
  values: ChatDocument['kit']['fillingSuccess'];
  days: number;
};
