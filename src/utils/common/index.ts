import isNumber = require('lodash/isNumber');
import { CardioDocument } from 'modules/stats/models/cardio.model';
import * as moment from 'moment';
import { EStatsDBKeyName } from 'utils/stats/types';

import {
  TCheckToUndefined,
  TCheckToNumberParams,
  TRepliedMessage,
  TComputeAverageValueByStat,
  TDefaultPeriodTemplate,
  DEFAULT_ZERO_VALUE,
  TGetPressureAndPulseFromString,
} from './types';

export const checkToUndefined = (text: string): TCheckToUndefined =>
  text === 'undefined' ? undefined : text;

export const checkToNumber = (value: TCheckToNumberParams): boolean =>
  isNumber(value);

export const computeAverageValue = (list) =>
  +(list.reduce((acc, cur) => acc + +cur, 0) / list.length).toFixed();

export const computeAverageValueByStat = (
  array: TComputeAverageValueByStat[],
  byStat: EStatsDBKeyName,
): number => {
  if (!array.length) {
    return 0;
  }

  return +(
    array.reduce((acc, cur) => acc + +cur[byStat], 0) / array.length
  ).toFixed();
};

export const computeAverageCardio = (cardioList: CardioDocument[]) => {
  if (!cardioList.length) {
    return null;
  }

  const { pulseList, sysList, diaList } = cardioList.reduce(
    (acc, cur) => {
      const pulse = cur.pulse;
      const [sys, dia] = cur.pressure.split('/');

      return {
        pulseList: [...acc.pulseList, pulse],
        sysList: [...acc.sysList, sys],
        diaList: [...acc.diaList, dia],
      };
    },
    {
      pulseList: [] as string[],
      sysList: [] as string[],
      diaList: [] as string[],
    },
  );

  const averagePulse = computeAverageValue(pulseList);
  const averageSys = computeAverageValue(sysList);
  const averageDia = computeAverageValue(diaList);

  return `${averageSys}/${averageDia} ${averagePulse}`;
};

export const getMaxCardio = (cardio: CardioDocument) => {
  if (!cardio) {
    return null;
  }

  const { pressure, pulse } = cardio;

  return `${pressure} ${pulse}`;
};

export const repliedMessage = (
  repliedMessageId: string,
  repliedMessageBody: string,
): TRepliedMessage =>
  checkToUndefined(repliedMessageId)
    ? {
        repliedMessageId: checkToUndefined(repliedMessageId),
        repliedMessageBody: checkToUndefined(repliedMessageBody),
      }
    : undefined;

export enum EPeriod {
  CURRENT = 'current',
  PREVIOUS = 'previous',
}

export enum EPeriodOfTime {
  WEEK = 'week',
  MONTH = 'month',
  FOUR_WEEKS = 'four weeks',
}

const chooseStartOrEndByPeriod = (
  period: EPeriodOfTime,
): {
  subtractValue: moment.unitOfTime.DurationConstructor;
  periodValue: moment.unitOfTime.StartOf;
} => ({
  subtractValue:
    period === EPeriodOfTime.WEEK || period === EPeriodOfTime.FOUR_WEEKS
      ? 'weeks'
      : 'month',
  periodValue:
    period === EPeriodOfTime.WEEK || period === EPeriodOfTime.FOUR_WEEKS
      ? 'week'
      : 'month',
});

export const getStartAndEndOfPeriod = (period: EPeriodOfTime) => {
  const { subtractValue, periodValue } = chooseStartOrEndByPeriod(period);

  if (period === EPeriodOfTime.FOUR_WEEKS)
    return {
      [EPeriod.CURRENT]: {
        start: moment().subtract(3, subtractValue).startOf(periodValue),
        end: moment(),
      },
      [EPeriod.PREVIOUS]: {
        start: moment().subtract(7, subtractValue).startOf(periodValue),
        end: moment().subtract(4, subtractValue).endOf(periodValue),
      },
    };

  return {
    [EPeriod.CURRENT]: {
      start: moment().startOf(periodValue),
      end: moment(),
    },
    [EPeriod.PREVIOUS]: {
      start: moment().subtract(1, subtractValue).startOf(periodValue),
      end: moment().subtract(1, subtractValue).endOf(periodValue),
    },
  };
};

export const getDefaultPeriodTemplate = (
  template: TDefaultPeriodTemplate,
): TDefaultPeriodTemplate => {
  const period =
    template.period === EPeriodOfTime.WEEK
      ? EPeriodOfTime.MONTH
      : EPeriodOfTime.WEEK;

  return {
    period,
    [EPeriod.CURRENT]: DEFAULT_ZERO_VALUE,
    [EPeriod.PREVIOUS]: DEFAULT_ZERO_VALUE,
  };
};

export const definePeriodKey = (template: TDefaultPeriodTemplate) => {
  if (template.period === EPeriodOfTime.WEEK) {
    return template[EPeriod.CURRENT] ? EPeriod.PREVIOUS : EPeriod.CURRENT;
  }

  return template[EPeriod.CURRENT] ? EPeriod.PREVIOUS : EPeriod.CURRENT;
};

export const calculateWeeklyValueFromMonth = (monthlyValue: number) =>
  +(monthlyValue / 4).toFixed(0);

export const calculateMonthlyValueFromWeek = (weeklyValue: number) =>
  +(weeklyValue * 4).toFixed(0);

// example cardio value '110/65 65'
export const getPressureAndPulseFromString = (
  cardio: string | null,
): TGetPressureAndPulseFromString => {
  if (!cardio) {
    return {
      systolic: DEFAULT_ZERO_VALUE,
      diastolic: DEFAULT_ZERO_VALUE,
      pulse: DEFAULT_ZERO_VALUE,
    };
  }

  const [pressure, pulse] = cardio.split(' ');
  const [systolic, diastolic] = pressure.split('/');

  return {
    systolic: +systolic,
    diastolic: +diastolic,
    pulse: +pulse,
  };
};
