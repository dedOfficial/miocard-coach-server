export type TCheckToUndefined = string | undefined;

export const DEFAULT_ZERO_VALUE = 0;
export const DEFAULT_ONE_VALUE = 1;

export type TCheckToNumberParams = number | undefined | null;
import { EPeriodOfTime } from 'utils/common';
import { TStat } from 'utils/stats/types';

export type TRepliedMessage =
  | {
      repliedMessageId: string | undefined;
      repliedMessageBody: string | undefined;
    }
  | undefined;

export type TComputeAverageValueByStat = TStat;

export type TDefaultPeriodTemplate = {
  period: EPeriodOfTime;
  previous: number;
  current: number;
};

export type TGetPressureAndPulseFromString = {
  systolic: number;
  diastolic: number;
  pulse: number;
};
