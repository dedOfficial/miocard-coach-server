import {
  calculateWeeklyValueFromMonth,
  EPeriod,
  EPeriodOfTime,
} from 'utils/common';
import { DEFAULT_ZERO_VALUE } from 'utils/common/types';
import { EDashboardBlockHighlight } from '../../dashboard/constants';
import { trackingParameterBlockTemplate } from '../helpers';

export const TRACKED_PARAMETER_NOT_FOUND_ERROR = 'Tracked Parameter not found';
export const CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR =
  'Chats not found for current operatorId';
export const PARAMETER_SAVING_ERROR = 'Parameter saving error';
export const SOMETHING_WENT_WRONG_ERROR =
  'Something went wrong while counting ';

export const DEFAULT_PERIODS_TEMPLATE = (period: EPeriodOfTime) => ({
  [EPeriod.CURRENT]:
    period === EPeriodOfTime.WEEK ? EPeriodOfTime.WEEK : EPeriodOfTime.MONTH,
  [EPeriod.PREVIOUS]:
    period === EPeriodOfTime.MONTH ? EPeriodOfTime.MONTH : EPeriodOfTime.WEEK,
});

export enum EAllowedTrackedParameters {
  BP_MEASUREMENTS_CONTROL = 'BP measurements control',
  PATIENT_RETURN = 'Patient return',
  CHECKIN_PROBLEMS = 'Check-in problems',
  DATA_COLLECTION = 'Data collection',
}

export const AllOWED_TRACKED_PARAMETERS = [
  EAllowedTrackedParameters.BP_MEASUREMENTS_CONTROL,
  EAllowedTrackedParameters.PATIENT_RETURN,
  EAllowedTrackedParameters.CHECKIN_PROBLEMS,
  EAllowedTrackedParameters.DATA_COLLECTION,
];

export const DEFAULT_TRACKED_PARAMETER_STAT_VALUE = (
  name: string,
  id: string,
  norm: number,
  guide: ENormGuides,
  percentage: boolean,
  type: EAllowedTemplateBlockType,
) => ({
  name,
  [type === EAllowedTemplateBlockType.COACH
    ? EAllowedTemplateBlockType.COACH
    : EAllowedTemplateBlockType.CHAT]: id,
  statistics: trackingParameterBlockTemplate(
    DEFAULT_ZERO_VALUE,
    DEFAULT_ZERO_VALUE,
    DEFAULT_ZERO_VALUE,
    DEFAULT_ZERO_VALUE,
    norm,
    guide,
    percentage,
  ),
});

export const DEFAULT_CHECKIN_PROBLEM_PERIOD = (
  period: EPeriodOfTime,
  maxLimit?: number,
) => ({
  period: period,
  problems: DEFAULT_ZERO_VALUE,
  completedSession: DEFAULT_ZERO_VALUE,
  maxLimit: maxLimit ?? DEFAULT_ZERO_VALUE,
  highlight: EDashboardBlockHighlight.GREEN,
});

export const DEFAULT_CHECKIN_PROBLEMS_TRACKED_PARAMETER = (
  operatorId: string,
  operatorName: string,
  maxLimit: number,
) => ({
  _id: operatorId,
  dummyName: operatorName,
  [EPeriodOfTime.WEEK]: DEFAULT_CHECKIN_PROBLEM_PERIOD(
    EPeriodOfTime.WEEK,
    calculateWeeklyValueFromMonth(maxLimit),
  ),
  [EPeriodOfTime.MONTH]: DEFAULT_CHECKIN_PROBLEM_PERIOD(
    EPeriodOfTime.MONTH,
    maxLimit,
  ),
});

export const NumberOfWeeksForPatientReturn = {
  previous: [7, 6, 5, 4],
  current: [3, 2, 1, 0],
};

export enum ENormGuides {
  MIN_NORM = 'minNorm',
  MAX_LIMIT = 'maxLimit',
}

export enum EAllowedTemplateBlockType {
  COACH = 'operatorId',
  CHAT = 'shortKey',
}
