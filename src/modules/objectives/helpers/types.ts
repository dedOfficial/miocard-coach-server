import { ChatDocument } from 'modules/operator/models/chat.model';
import { OperatorDocument } from 'modules/operator/models/operator.model';
import { CardioDocument } from 'modules/stats/models/cardio.model';
import { Dictionary } from 'types/global';
import { EPeriodOfTime } from 'utils/common';
import { ECardio } from 'utils/stats';
import { EStatsDBKeyName, TStat } from 'utils/stats/types';
import { EObjectiveReturnObjectsKey, ETypeofOperatorId } from '../constants';
import { ObjectiveNormValueDto } from '../dto/objectives.dto';

export const INDEX_IN_ARRAY_OF_SYSTOLIC_AND_DIASTOLIC = {
  [ECardio.SYSTOLIC]: 0,
  [ECardio.DIASTOLIC]: 1,
};

export const operatorOrAssistant = {
  [ETypeofOperatorId.OPERATOR_ID]: 0,
  [ETypeofOperatorId.ASSISTANT_ID]: 1,
};

export type TGetPercentageDifferenceFromTwoNumbers = {
  thisNumber: number;
  isWhatPercentOfThisNumber: number;
};

export type TGetAmountOrDefaultValueOfStat = {
  amount: number;
};

export interface IGetMeasurementTemplateValueProps {
  chat: ChatDocument;
  firstNormValue: ObjectiveNormValueDto;
  valueForWeek: number;
  valueForMonth: number;
}

export type TGetMeasurementTemplateValueReturn = IObjectiveTemplateByAssistantByWeekAndMonth;

export interface IGetPatientSelfEfficacyTemplateValueParams {
  chat: ChatDocument;
  firstNormValue: ObjectiveNormValueDto;
}

export type TGetPatientSelfEfficacyTemplateValueReturn = IObjectiveTemplateByOperatorByMonth;

type TObjectiveReturnValueForPeriod = Array<{
  [EObjectiveReturnObjectsKey.ACTUAL]: number;
  [EObjectiveReturnObjectsKey.NORM]: number;
  [EObjectiveReturnObjectsKey.HIGHLIGHTED]: string;
}>;

type TObjectiveReturnValueForPeriodWithoutNorm = Array<{
  [EObjectiveReturnObjectsKey.ACTUAL]: number;
}>;

type TObjectiveReturnValueForCardio = Array<{
  [ECardio.SYSTOLIC]: number;
  [ECardio.DIASTOLIC]: number;
}>;

type TObjectiveReturnValueForCardioWithNorm = Array<{
  [ECardio.SYSTOLIC]: number;
  [ECardio.DIASTOLIC]: number;
  [EObjectiveReturnObjectsKey.NORM]: number;
}>;

type TObjectiveReturnValueForMaxLimit = Array<{
  [EObjectiveReturnObjectsKey.MAX_LIMIT]: number;
  [EObjectiveReturnObjectsKey.ACTUAL]: number;
}>;

interface IObjectiveCardioTemplateWeekAndMonth {
  operatorId: string;
  [EPeriodOfTime.WEEK]: TObjectiveReturnValueForCardio;
  [EPeriodOfTime.MONTH]: TObjectiveReturnValueForCardioWithNorm;
}

interface IObjectiveWithMaxLimitByOperatorWeekAndMonth {
  operatorId: string;
  [EPeriodOfTime.WEEK]: TObjectiveReturnValueForMaxLimit;
  [EPeriodOfTime.MONTH]: TObjectiveReturnValueForMaxLimit;
}

interface IObjectiveWithMaxLimitByAssistantWeekAndMonth {
  assistantId: string;
  [EPeriodOfTime.WEEK]: TObjectiveReturnValueForMaxLimit;
  [EPeriodOfTime.MONTH]: TObjectiveReturnValueForMaxLimit;
}

// Types for week and month
interface IObjectiveTemplateWeekAndMonth {
  [EPeriodOfTime.WEEK]: TObjectiveReturnValueForPeriod;
  [EPeriodOfTime.MONTH]: TObjectiveReturnValueForPeriod;
}

interface IObjectiveTemplateWeekAndMonthWithoutNorm {
  [EPeriodOfTime.WEEK]: TObjectiveReturnValueForPeriodWithoutNorm;
  [EPeriodOfTime.MONTH]: TObjectiveReturnValueForPeriod;
}

interface IObjectiveTemplateByOperatorByWeekAndMonth
  extends IObjectiveTemplateWeekAndMonth {
  operatorId: string;
}

interface IObjectiveTemplateByOperatorByWeekAndMonthWithoutNorm
  extends IObjectiveTemplateWeekAndMonthWithoutNorm {
  operatorId: string;
}

interface IObjectiveTemplateByAssistantByWeekAndMonth
  extends IObjectiveTemplateWeekAndMonth {
  assistantId: string;
}

interface IObjectiveTemplateByAssistantByWeekAndMonthWithoutNorm
  extends IObjectiveTemplateWeekAndMonthWithoutNorm {
  assistantId: string;
}
///

// Types for month
interface IObjectiveTemplateMonth {
  [EPeriodOfTime.MONTH]: TObjectiveReturnValueForPeriod;
}

export interface IObjectiveTemplateByOperatorByMonth
  extends IObjectiveTemplateMonth {
  operatorId: string;
}
///

export interface IGetRepeatabilityOfHabitsTemplateValueParams {
  operatorId: string;
  firstNormValue: ObjectiveNormValueDto;
  valueForWeek: number;
  valueForMonth: number;
}

export type IGetRepeatabilityOfHabitsTemplateValueReturn = {
  operatorId: string;
  [EPeriodOfTime.WEEK]: {
    [EObjectiveReturnObjectsKey.ACTUAL]: number;
  }[];
  [EPeriodOfTime.MONTH]: {
    [EObjectiveReturnObjectsKey.ACTUAL]: number;
    [EObjectiveReturnObjectsKey.NORM]: number;
    [EObjectiveReturnObjectsKey.HIGHLIGHTED]: string;
  }[];
};

export interface IGetRecommendationsToFollowTemplateValueParams {
  operatorId: string;
  firstNormValue: ObjectiveNormValueDto;
  valueForWeek: number;
  valueForMonth: number;
}
export type IGetRecommendationsToFollowTemplateValueReturn = {
  operatorId: string;
  [EPeriodOfTime.WEEK]: {
    [EObjectiveReturnObjectsKey.ACTUAL]: number;
  }[];
  [EPeriodOfTime.MONTH]: {
    [EObjectiveReturnObjectsKey.ACTUAL]: number;
    [EObjectiveReturnObjectsKey.NORM]: number;
    [EObjectiveReturnObjectsKey.HIGHLIGHTED]: string;
  }[];
};

export type TGetSystolicAndDiastolicFromCardio = {
  currentPeriodList: CardioDocument[];
  previousPeriodList: CardioDocument[];
  systolicNormValue: ObjectiveNormValueDto;
  diastolicNormValue: ObjectiveNormValueDto;
};

export interface IGetCheckinProblemsTemplateValue {
  operatorOrAssistantId: string;
  operatorTypeId: ETypeofOperatorId;
  firstNormValue: ObjectiveNormValueDto;
  statValuesForCurrentWeek: Array<{ amount: number }>;
  statValuesForCurrentMonth: Array<{ amount: number }>;
}

export interface ICountUniqueAmountValuesForPeriod {
  firstNormValue: ObjectiveNormValueDto;
  currentPeriodValue: Array<TGetAmountOrDefaultValueOfStat>;
  previousPeriodValue: Array<TGetAmountOrDefaultValueOfStat>;
}

export interface IGetValueDifferenceByAverageValue {
  firstNormValue: ObjectiveNormValueDto;
  currentPeriodList: TStat[];
  previousPeriodList: TStat[];
  statDBKeyName: EStatsDBKeyName;
}

// Case One by Operator by week and month
export interface ICombineTemplateByOperatorByWeekAndMonthParams {
  groupedResultByOperatorId:
    | Dictionary<IObjectiveTemplateByOperatorByWeekAndMonth[]>
    | Dictionary<IObjectiveTemplateByOperatorByWeekAndMonthWithoutNorm[]>;
  operatorsById: Dictionary<OperatorDocument>;
}

// Case One by Operator by week and month
export interface ICombineTemplateByOperatorByWeekAndMonthReturn
  extends IObjectiveTemplateByOperatorByWeekAndMonth {
  // TODO check IObjectiveTemplateByOperatorByWeekAndMonth
  name: string;
}

// Case Two by Assistant by week and month
export interface ICombineTemplateByAssistantByWeekAndMonthParams {
  groupedResultByAssistantId:
    | Dictionary<IObjectiveTemplateByAssistantByWeekAndMonth[]>
    | Dictionary<IObjectiveTemplateByAssistantByWeekAndMonthWithoutNorm>[];
  assistantsById: Dictionary<OperatorDocument>;
}

// Case Two by Assistant by week and month
export interface ICombineTemplateByAssistantByWeekAndMonthReturn
  extends ICombineTemplateByAssistantByWeekAndMonthParams {
  name: string;
}

// Case Three by Operator by month
export interface ICombineTemplatesByOperatorByMonthParams {
  groupedResultByOperatorId: Dictionary<IObjectiveTemplateByOperatorByMonth[]>;
  operatorsById: Dictionary<OperatorDocument>;
}

// Case Three by Operator by month
export interface ICombineTemplatesByOperatorByMonthReturn
  extends IObjectiveTemplateByOperatorByMonth {
  name: string;
}

// Case Four. Cardio by operator for week and month
export interface ICombineTemplatesCardioByOperatorByWeekAndMonthParams {
  groupedResultByOperatorId: Dictionary<IObjectiveCardioTemplateWeekAndMonth[]>;
  operatorsById: Dictionary<OperatorDocument>;
}

// Case Four. Cardio by operator for week and month
export interface ICombineTemplatesCardioByOperatorByWeekAndMonthParamsReturn
  extends IObjectiveCardioTemplateWeekAndMonth {
  name: string;
  operatorId: string;
}

// Case Five. MaxLimit by Operator or Assistant by week and month
export interface ICombineTemplatesByOperatorOrAssistantByWeekAndMonth {
  groupedResultByOperatorId:
    | Dictionary<IObjectiveWithMaxLimitByOperatorWeekAndMonth[]>
    | Dictionary<IObjectiveWithMaxLimitByAssistantWeekAndMonth[]>;
  operatorsById: Dictionary<OperatorDocument>;
  operatorOrAssistantId: ETypeofOperatorId;
}

// Case Five. MaxLimit by Operator or Assistant by week and month
export interface ICombineTemplatesByOperatorOrAssistantByWeekAndMonthReturn {
  name: string;
  operatorId?: string;
  assistantId?: string;
  [EPeriodOfTime.WEEK]: TObjectiveReturnValueForMaxLimit;
  [EPeriodOfTime.MONTH]: TObjectiveReturnValueForMaxLimit;
}

export interface ICombinedTemplateByWeekAndMonthParams {
  acc: any;
  cur:
    | IObjectiveTemplateByOperatorByWeekAndMonth
    | IObjectiveTemplateByOperatorByWeekAndMonthWithoutNorm
    | IObjectiveTemplateByAssistantByWeekAndMonth
    | IObjectiveTemplateByAssistantByWeekAndMonthWithoutNorm;
  operatorsOrAssistantsById: Dictionary<OperatorDocument>;
  wholeArray: Array<unknown>;
  operatorOrAssistantId: ETypeofOperatorId;
  isLastElement: boolean;
}

export interface ICombinedTemplateByMonthParams {
  acc: any;
  cur: IObjectiveTemplateByOperatorByMonth;
  operatorsOrAssistantsById: Dictionary<OperatorDocument>;
  wholeArray: Array<unknown>;
  operatorOrAssistantId: ETypeofOperatorId;
  isLastElement: boolean;
}

export interface ICombinedTemplatesCardioByWeekAndMonthParams {
  acc: any;
  cur: IObjectiveCardioTemplateWeekAndMonth;
  operatorsOrAssistantsById: Dictionary<OperatorDocument>;
  wholeArray: Array<unknown>;
  operatorOrAssistantId: ETypeofOperatorId;
  isLastElement: boolean;
}

export interface ICombinedTemplatesByWeekAndMonthParams {
  acc: any;
  cur:
    | IObjectiveWithMaxLimitByOperatorWeekAndMonth
    | IObjectiveWithMaxLimitByAssistantWeekAndMonth;
  operatorsOrAssistantsById: Dictionary<OperatorDocument>;
  wholeArray: Array<unknown>;
  operatorOrAssistantId: ETypeofOperatorId;
  isLastElement: boolean;
}

export interface ICountValueForSystolicOrDiastolic
  extends Omit<
    ICombinedTemplatesCardioByWeekAndMonthParams,
    'operatorsOrAssistantsById' | 'operatorOrAssistantId'
  > {
  period: EPeriodOfTime;
  systolicOrDiastolic: ECardio;
}

export interface IGetPatientReturnTemplateValueProps {
  operatorOrAssistantId: string;
  operatorTypeId: ETypeofOperatorId;
  firstNormValue: ObjectiveNormValueDto;
  valueForWeek: number;
  valueForMonth: number;
}

export type TGetPatientReturnTemplateValueReturn = IObjectiveTemplateByAssistantByWeekAndMonth;

export type TGetPercentageValueDifferenceFromHundredPercentParams = {
  value: number;
  currentPeriodValue: number;
  previousPeriodValue: number;
};
