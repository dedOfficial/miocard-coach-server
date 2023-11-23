import * as moment from 'moment';

import { CardioDocument } from 'modules/stats/models/cardio.model';
import {
  TCheckinProblemPeriod,
  TCheckinProblems,
  TCustomPeriodTemplate,
  TFillingSuccessValuesChatByPeriod,
  TOneUniqueStatByChat,
  TTrackedParameterByCoach,
  TTrackedParameterStats,
} from './types';
import { ChatDocument } from 'modules/operator/models/chat.model';
import {
  DEFAULT_CHECKIN_PROBLEM_PERIOD,
  DEFAULT_PERIODS_TEMPLATE,
  DEFAULT_TRACKED_PARAMETER_STAT_VALUE,
  EAllowedTemplateBlockType,
  ENormGuides,
  NumberOfWeeksForPatientReturn,
  SOMETHING_WENT_WRONG_ERROR,
} from '../constants';
import {
  calculateWeeklyValueFromMonth,
  definePeriodKey,
  EPeriod,
  EPeriodOfTime,
  getDefaultPeriodTemplate,
  getStartAndEndOfPeriod,
} from 'utils/common';
import { DEFAULT_ZERO_VALUE } from 'utils/common/types';
import { NotFoundException } from '@nestjs/common';
import { CheckinDocument } from 'modules/stats/models/checkin.model';
import { EAllowedCheckinCheckboxes } from 'modules/stats/constants';
import { PlannedCheckinDTO } from '../dto/dataTrackedParameters.dto';
import { EDashboardBlockHighlight } from '../../dashboard/constants';
import groupBy = require('lodash/groupBy');
import last = require('lodash/last');
import first = require('lodash/first');
import mean = require('lodash/mean');

export const addChatsWithoutStats = (
  chats: ChatDocument[],
  chatsWithStats: TTrackedParameterStats[],
  minNorm: number,
): TTrackedParameterStats[] => {
  const chatsWithoutStats = chats.reduce((acc, { dummyName, shortKey }) => {
    const findInExistingChatsWithStats = chatsWithStats.find(
      (chat) => chat.name === dummyName,
    );

    if (findInExistingChatsWithStats) {
      return acc;
    }

    return [
      ...acc,
      DEFAULT_TRACKED_PARAMETER_STAT_VALUE(
        dummyName,
        shortKey,
        minNorm,
        ENormGuides.MIN_NORM,
        false,
        EAllowedTemplateBlockType.CHAT,
      ),
    ];
  }, []);

  return [...chatsWithStats, ...chatsWithoutStats];
};

const combineWeekAndMonth = (
  longestArray: TTrackedParameterStats[],
  shortestArray: TTrackedParameterStats[],
) => {
  return longestArray.map((value) => {
    const findElement = shortestArray.find(
      (secondValue) => secondValue.name === value.name,
    );

    if (findElement) {
      return {
        ...value,
        statistics: [findElement.statistics[0], value.statistics[0]],
      };
    } else {
      return {
        ...value,
        statistics: [
          value.statistics[0],
          getDefaultPeriodTemplate(value.statistics[0]),
        ],
      };
    }
  });
};

export const combineStatisticsForWeekAndMonth = (
  firstArray: TTrackedParameterStats[],
  secondArray: TTrackedParameterStats[],
) => {
  if (firstArray.length > secondArray.length) {
    return combineWeekAndMonth(firstArray, secondArray);
  }

  return combineWeekAndMonth(secondArray, firstArray);
};

const mergeStatisticsArrays = (
  longestArray: TTrackedParameterStats[],
  shortestArray: TTrackedParameterStats[],
) => {
  return longestArray.map((value) => {
    const findElement = shortestArray.find(
      (secondValue) => secondValue.name === value.name,
    );

    if (findElement) {
      return {
        ...value,
        statistics: [{ ...value.statistics[0], ...findElement.statistics[0] }],
      };
    } else {
      return {
        ...value,
        statistics: [
          {
            ...value.statistics[0],
            [definePeriodKey(value.statistics[0])]: DEFAULT_ZERO_VALUE,
          },
        ],
      };
    }
  });
};

export const mergeTwoArrayWithStatistics = (
  firstArray: TTrackedParameterStats[],
  secondArray: TTrackedParameterStats[],
) => {
  if (firstArray.length > secondArray.length) {
    return mergeStatisticsArrays(firstArray, secondArray);
  }

  return mergeStatisticsArrays(secondArray, firstArray);
};

export const countChatsByPeriod = async (
  requests,
  savedChatNames,
  savedShortKeys,
  currentOrPreviousPeriod: EPeriod,
  period: EPeriodOfTime,
  minNorm: number,
) => {
  return await Promise.all(requests)
    .then((allStatsByOperator) => {
      return allStatsByOperator.reduce(
        (acc: TTrackedParameterStats[], allStats: any) => {
          const uniqueAmountOfStatsByChat = allStats.reduce((acc, { day }) => {
            if (acc.includes(day)) {
              return acc;
            }

            return [...acc, day];
          }, []).length;

          const oneUniqueStatByChat = allStats.reduce((acc, cur) => {
            const { clientNumber } = cur;

            if (acc[clientNumber]) {
              return acc;
            }

            return { ...acc, [clientNumber]: cur };
          }, {} as TOneUniqueStatByChat);

          if (uniqueAmountOfStatsByChat !== 0) {
            return [
              ...acc,
              {
                name: savedChatNames[Object.keys(oneUniqueStatByChat)[0]],
                shortKey: savedShortKeys[Object.keys(oneUniqueStatByChat)[0]],
                statistics: [
                  {
                    period: DEFAULT_PERIODS_TEMPLATE(period)[
                      currentOrPreviousPeriod
                    ],
                    [currentOrPreviousPeriod]: uniqueAmountOfStatsByChat,
                    highlight: getHighlightColor(
                      uniqueAmountOfStatsByChat,
                      minNorm,
                      ENormGuides.MIN_NORM,
                    ),
                    minNorm,
                  },
                ],
              },
            ];
          }

          return acc;
        },
        [] as TTrackedParameterStats[],
      ) as TTrackedParameterStats[];
    })
    .catch(() => {
      throw new NotFoundException(SOMETHING_WENT_WRONG_ERROR + 'ChatsByPeriod');
    });
};

export const countStatsByChats = async (
  chats: ChatDocument[],
  savedChatsNames: { [key: string]: string },
  savedShortKeys: { [key: string]: string },
  periodsRequests: Record<string, Promise<CardioDocument[]>[]>,
  minNorm: number,
) => {
  const {
    requestsForCurrentWeek,
    requestsForPreviousWeek,
    requestsForCurrentMonth,
    requestsForPreviousMonth,
  } = periodsRequests;

  const currentWeekData = await countChatsByPeriod(
    requestsForCurrentWeek,
    savedChatsNames,
    savedShortKeys,
    EPeriod.CURRENT,
    EPeriodOfTime.WEEK,
    calculateWeeklyValueFromMonth(minNorm),
  );

  const previousWeekData = await countChatsByPeriod(
    requestsForPreviousWeek,
    savedChatsNames,
    savedShortKeys,
    EPeriod.PREVIOUS,
    EPeriodOfTime.WEEK,
    calculateWeeklyValueFromMonth(minNorm),
  );

  const currentMonthData = await countChatsByPeriod(
    requestsForCurrentMonth,
    savedChatsNames,
    savedShortKeys,
    EPeriod.CURRENT,
    EPeriodOfTime.MONTH,
    minNorm,
  );

  const previousMonthData = await countChatsByPeriod(
    requestsForPreviousMonth,
    savedChatsNames,
    savedShortKeys,
    EPeriod.PREVIOUS,
    EPeriodOfTime.MONTH,
    minNorm,
  );

  const combinedChatsWithStats = combineStatisticsForWeekAndMonth(
    mergeTwoArrayWithStatistics(currentWeekData, previousWeekData),
    mergeTwoArrayWithStatistics(currentMonthData, previousMonthData),
  );

  return addChatsWithoutStats(chats, combinedChatsWithStats, minNorm);
};

export const getValueByPeriod = (
  acc: TTrackedParameterStats,
  cur: TTrackedParameterStats,
  period: EPeriodOfTime,
): Record<string, number> => {
  const accCurrentPeriod = groupBy(acc.statistics, 'period')[period][0][
    EPeriod.CURRENT
  ];
  const accPreviousPeriod = groupBy(acc.statistics, 'period')[period][0][
    EPeriod.PREVIOUS
  ];
  const curCurrentPeriod = groupBy(cur.statistics, 'period')[period][0][
    EPeriod.CURRENT
  ];
  const cutPreviousPeriod = groupBy(cur.statistics, 'period')[period][0][
    EPeriod.PREVIOUS
  ];

  return {
    accCurrentPeriod,
    accPreviousPeriod,
    curCurrentPeriod,
    cutPreviousPeriod,
  };
};

const combineCheckinProblemsByOperator = (
  checkinProblems: Array<{ _id: string } & TCheckinProblems>,
) => {
  return checkinProblems.reduce(
    (acc, cur, index) => {
      if (index === 0) {
        // the first element of array will replace the default value
        return cur;
      }

      return {
        ...acc,
        [EPeriodOfTime.WEEK]: {
          ...acc[EPeriodOfTime.WEEK],
          problems:
            acc[EPeriodOfTime.WEEK].problems + cur[EPeriodOfTime.WEEK].problems,
          completedSession:
            acc[EPeriodOfTime.WEEK].completedSession +
            cur[EPeriodOfTime.WEEK].completedSession,
          highlight: getHighlightColor(
            acc[EPeriodOfTime.WEEK].problems + cur[EPeriodOfTime.WEEK].problems,
            cur[EPeriodOfTime.WEEK].maxLimit,
            ENormGuides.MAX_LIMIT,
          ),
        },
        [EPeriodOfTime.MONTH]: {
          ...acc[EPeriodOfTime.MONTH],
          problems:
            acc[EPeriodOfTime.MONTH].problems +
            cur[EPeriodOfTime.MONTH].problems,
          completedSession:
            acc[EPeriodOfTime.MONTH].completedSession +
            cur[EPeriodOfTime.MONTH].completedSession,
          highlight: getHighlightColor(
            acc[EPeriodOfTime.MONTH].problems +
              cur[EPeriodOfTime.MONTH].problems,
            cur[EPeriodOfTime.MONTH].maxLimit,
            ENormGuides.MAX_LIMIT,
          ),
        },
      };
    },
    {
      dummyName: '',
      [EPeriodOfTime.WEEK]: DEFAULT_CHECKIN_PROBLEM_PERIOD(EPeriodOfTime.WEEK),
      [EPeriodOfTime.MONTH]: DEFAULT_CHECKIN_PROBLEM_PERIOD(
        EPeriodOfTime.MONTH,
      ),
    },
  );
};

export const countStatsByCheckinProblemsForByOperator = async (
  operatorName: string,
  operatorId: string,
  maxLimit: number,
  periodsRequests: Record<string, Promise<CheckinDocument[]>[]>,
) => {
  const { requestsForCurrentWeek, requestsForCurrentMonth } = periodsRequests;

  const checkinProblemsForCurrentWeek = await countCheckinProblemsByPeriodByCouch(
    requestsForCurrentWeek,
    EPeriodOfTime.WEEK,
    maxLimit,
  );

  const checkinProblemsForCurrentMonth = await countCheckinProblemsByPeriodByCouch(
    requestsForCurrentMonth,
    EPeriodOfTime.MONTH,
    maxLimit,
  );

  const allCheckinProblemsByOperator = checkinProblemsForCurrentWeek.map(
    (checkin, index) => ({
      _id: operatorId,
      dummyName: operatorName,
      [EPeriodOfTime.WEEK]: checkin,
      [EPeriodOfTime.MONTH]: checkinProblemsForCurrentMonth[index],
    }),
  );

  return combineCheckinProblemsByOperator(allCheckinProblemsByOperator);
};

export const countStatsByCheckinProblems = async (
  savedChatsNames: Array<{ dummyName: string; _id: string; shortKey: string }>,
  maxLimit: number,
  periodsRequests: Record<string, Promise<CheckinDocument[]>[]>,
) => {
  const { requestsForCurrentWeek, requestsForCurrentMonth } = periodsRequests;

  const checkinProblemsForCurrentWeek = await countCheckinProblemsByPeriodByCouch(
    requestsForCurrentWeek,
    EPeriodOfTime.WEEK,
    maxLimit,
  );

  const checkinProblemsForCurrentMonth = await countCheckinProblemsByPeriodByCouch(
    requestsForCurrentMonth,
    EPeriodOfTime.MONTH,
    maxLimit,
  );

  return savedChatsNames.map((chatInfo, index) => ({
    ...chatInfo,
    [EPeriodOfTime.WEEK]: checkinProblemsForCurrentWeek[index],
    [EPeriodOfTime.MONTH]: checkinProblemsForCurrentMonth[index],
  }));
};

export const countCheckinProblemsByPeriodByCouch = (
  requests,
  period: EPeriodOfTime,
  maxLimit: number,
): Promise<TCheckinProblemPeriod[]> => {
  return Promise.all(requests)
    .then((allCheckinProblemsByOperator: any) => {
      return allCheckinProblemsByOperator.map(
        (checkinProblemsByOperator: CheckinDocument[]) => {
          const maxLimitValue =
            period === EPeriodOfTime.WEEK
              ? calculateWeeklyValueFromMonth(maxLimit)
              : maxLimit;

          if (!checkinProblemsByOperator.length) {
            return DEFAULT_CHECKIN_PROBLEM_PERIOD(period, maxLimitValue);
          }

          const completedSession = checkinProblemsByOperator.length;

          const problems = checkinProblemsByOperator.reduce((acc, cur) => {
            const isNoProblems = cur.checkinCheckboxes.includes(
              EAllowedCheckinCheckboxes.IS_NO_PROBLEMS,
            );

            if (isNoProblems) {
              return acc;
            }

            return acc + 1;
          }, 0);

          return {
            period,
            problems,
            completedSession,
            maxLimit: maxLimitValue,
            highlight: getHighlightColor(
              problems,
              maxLimitValue,
              ENormGuides.MAX_LIMIT,
            ),
          };
        },
      );
    })
    .catch(() => {
      throw new NotFoundException(
        SOMETHING_WENT_WRONG_ERROR + 'CheckinProblems',
      );
    });
};

export const calculatePercentageOfNumber = (number: number, length: number) =>
  +((number / length) * 100).toFixed();

export const getFillingSuccessByChatByPeriod = (
  chat: ChatDocument,
  period: EPeriod,
  periodOfTime: EPeriodOfTime,
) => {
  const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

  const days = end.diff(start, 'days') + 1;

  if (!chat.kit?.id) return { values: [], days };

  return {
    values: chat.kit.fillingSuccess.filter((item) => {
      const currentDay = moment(item.date, 'DD-MM-YYYY');
      return (
        moment(currentDay).isSameOrAfter(start) &&
        moment(currentDay).isSameOrBefore(end)
      );
    }),
    days,
  };
};

const calcAverageValueFillingSuccessForChat = (
  chatFillingSuccess: TFillingSuccessValuesChatByPeriod,
) => {
  if (!chatFillingSuccess.values.length) return 0;

  return +(
    chatFillingSuccess.values.reduce(
      (acc, fillingSuccess) =>
        calculatePercentageOfNumber(
          fillingSuccess.value,
          fillingSuccess.total,
        ) + acc,
      0,
    ) / chatFillingSuccess.days
  ).toFixed();
};

const calcAverageValueFillingSuccessForChats = (
  chatsFillingSuccess: Array<TFillingSuccessValuesChatByPeriod>,
) => {
  return +(
    chatsFillingSuccess.reduce(
      (acc, chatFillingSuccess) =>
        calcAverageValueFillingSuccessForChat(chatFillingSuccess) + acc,
      0,
    ) / chatsFillingSuccess.length
  ).toFixed();
};

const calcAverageValueFillingSuccessWholeProject = (data: number[]) => {
  return +(data.reduce((acc, item) => item + acc, 0) / data.length).toFixed();
};

export const countDataCollectionByOperator = (
  valuesForCurrentWeek: Array<TFillingSuccessValuesChatByPeriod>,
  valuesForPreviousWeek: Array<TFillingSuccessValuesChatByPeriod>,
  valuesForCurrentMonth: Array<TFillingSuccessValuesChatByPeriod>,
  valuesForPreviousMonth: Array<TFillingSuccessValuesChatByPeriod>,
  _id: string,
  name: string,
  minNorm: number,
) => {
  const currentWeek = calcAverageValueFillingSuccessForChats(
    valuesForCurrentWeek,
  );
  const previousWeek = calcAverageValueFillingSuccessForChats(
    valuesForPreviousWeek,
  );
  const currentMonth = calcAverageValueFillingSuccessForChats(
    valuesForCurrentMonth,
  );
  const previousMonth = calcAverageValueFillingSuccessForChats(
    valuesForPreviousMonth,
  );

  return {
    name,
    operatorId: _id,
    statistics: trackingParameterBlockTemplate(
      currentWeek,
      previousWeek,
      currentMonth,
      previousMonth,
      minNorm,
      ENormGuides.MIN_NORM,
      true,
    ),
  };
};

export const countDataCollectionWholeProject = (
  data: TTrackedParameterByCoach[],
  minNorm: number,
) => {
  const currentWeek = calcAverageValueFillingSuccessWholeProject(
    data.map((item) => item.statistics[0].current),
  );
  const previousWeek = calcAverageValueFillingSuccessWholeProject(
    data.map((item) => item.statistics[0].previous),
  );
  const currentMonth = calcAverageValueFillingSuccessWholeProject(
    data.map((item) => item.statistics[1].current),
  );
  const previousMonth = calcAverageValueFillingSuccessWholeProject(
    data.map((item) => item.statistics[1].previous),
  );

  return {
    statistics: trackingParameterBlockTemplate(
      currentWeek,
      previousWeek,
      currentMonth,
      previousMonth,
      minNorm,
      ENormGuides.MIN_NORM,
      true,
    ),
  };
};

export const countDataCollectionByChat = (
  fillingSuccessByChats: {
    name: string;
    shortKey: string;
    values: {
      currentWeek: TFillingSuccessValuesChatByPeriod;
      previousWeek: TFillingSuccessValuesChatByPeriod;
      currentMonth: TFillingSuccessValuesChatByPeriod;
      previousMonth: TFillingSuccessValuesChatByPeriod;
    };
  }[],
  minNorm: number,
) => {
  return fillingSuccessByChats.map(({ name, shortKey, values }) => ({
    name,
    shortKey,
    statistics: trackingParameterBlockTemplate(
      calcAverageValueFillingSuccessForChat(values.currentWeek),
      calcAverageValueFillingSuccessForChat(values.previousWeek),
      calcAverageValueFillingSuccessForChat(values.currentMonth),
      calcAverageValueFillingSuccessForChat(values.previousMonth),
      minNorm,
      ENormGuides.MIN_NORM,
      true,
    ),
  }));
};

export const trackingParameterBlockTemplate = (
  averageValueForCurrentWeek: number,
  averageValueForPreviousWeek: number,
  averageValueForCurrentMonth: number,
  averageValueForPreviousMonth: number,
  norm: number,
  guide: ENormGuides,
  percentage: boolean,
): TCustomPeriodTemplate[] => {
  const weeklyNorm = percentage ? norm : calculateWeeklyValueFromMonth(norm);
  return [
    {
      period: EPeriodOfTime.WEEK,
      [EPeriod.CURRENT]: averageValueForCurrentWeek,
      [EPeriod.PREVIOUS]: averageValueForPreviousWeek,
      highlight: getHighlightColor(
        averageValueForCurrentWeek,
        weeklyNorm,
        guide,
      ),
      [guide]: weeklyNorm,
    },
    {
      period: EPeriodOfTime.MONTH,
      [EPeriod.CURRENT]: averageValueForCurrentMonth,
      [EPeriod.PREVIOUS]: averageValueForPreviousMonth,
      highlight: getHighlightColor(averageValueForCurrentMonth, norm, guide),
      [guide]: norm,
    },
  ];
};

const getHighlightColor = (value: number, norm: number, guide: ENormGuides) => {
  if (value === norm) return EDashboardBlockHighlight.BLACK;
  if (
    Number.isInteger(value) &&
    ((guide === ENormGuides.MAX_LIMIT && value < norm) ||
      (guide === ENormGuides.MIN_NORM && value > norm))
  )
    return EDashboardBlockHighlight.GREEN;
  return EDashboardBlockHighlight.RED;
};

export const countPatientReturnByOperator = (
  valuesForCurrentWeek: number[],
  valuesForPreviousWeek: number[],
  valuesForCurrentFourWeeks: number[],
  valuesForPreviousFourWeeks: number[],
  _id: string,
  name: string,
  minNorm: number,
) => {
  const currentWeek = +mean(valuesForCurrentWeek).toFixed();
  const previousWeek = +mean(valuesForPreviousWeek).toFixed();
  const currentFourWeeks = +mean(valuesForCurrentFourWeeks).toFixed();
  const previousFourWeeks = +mean(valuesForPreviousFourWeeks).toFixed();
  return {
    name,
    operatorId: _id,
    statistics: trackingParameterBlockTemplate(
      currentWeek,
      previousWeek,
      currentFourWeeks,
      previousFourWeeks,
      minNorm,
      ENormGuides.MIN_NORM,
      true,
    ),
  };
};

export const calcPatientReturn = (
  patientReturnDays: Array<{ date: string }>,
  plannedCheckins: PlannedCheckinDTO[],
  period: EPeriod,
  periodOfTime: EPeriodOfTime,
) => {
  if (!plannedCheckins.length) return null;
  if (!patientReturnDays.length) return DEFAULT_ZERO_VALUE;

  switch (true) {
    case period === EPeriod.CURRENT && periodOfTime === EPeriodOfTime.WEEK:
      const {
        currentPlannedCheckins,
        previousPlannedCheckins,
        createdAt,
      }: PlannedCheckinDTO = last(plannedCheckins);
      const currentWeekValue =
        moment(createdAt).week() === moment().week() &&
        previousPlannedCheckins !== 0
          ? Math.min(currentPlannedCheckins, previousPlannedCheckins)
          : currentPlannedCheckins;
      return calculatePercentageOfNumber(
        patientReturnDays.length,
        currentWeekValue,
      );
    case period === EPeriod.PREVIOUS && periodOfTime === EPeriodOfTime.WEEK:
      const numberOfPreviousWeek = moment()
        .subtract(1, EPeriodOfTime.WEEK)
        .week();
      const previousWeekValue = findActualValuePlannedCheckin(
        numberOfPreviousWeek,
        plannedCheckins,
      );
      return calculatePercentageOfNumber(
        patientReturnDays.length,
        previousWeekValue,
      );
    case period === EPeriod.CURRENT &&
      periodOfTime === EPeriodOfTime.FOUR_WEEKS:
      return calcPatientReturnForWeeks(
        period,
        plannedCheckins,
        patientReturnDays,
      );
    case period === EPeriod.PREVIOUS &&
      periodOfTime === EPeriodOfTime.FOUR_WEEKS:
      return calcPatientReturnForWeeks(
        period,
        plannedCheckins,
        patientReturnDays,
      );
  }
};

const findPlannedCheckinForPastWeek = (
  numberOfWeek: number,
  plannedCheckins: PlannedCheckinDTO[],
): Record<string, PlannedCheckinDTO> => {
  return {
    current: last(
      plannedCheckins.filter(
        ({ createdAt }) =>
          moment(createdAt).isSameOrAfter(
            moment()
              .subtract(numberOfWeek, EPeriodOfTime.WEEK)
              .startOf(EPeriodOfTime.WEEK),
          ) &&
          moment(createdAt).isSameOrBefore(
            moment()
              .subtract(numberOfWeek, EPeriodOfTime.WEEK)
              .endOf(EPeriodOfTime.WEEK),
          ),
      ),
    ),
    past: last(
      plannedCheckins.filter(({ createdAt }) =>
        moment(createdAt).isSameOrBefore(
          moment()
            .subtract(numberOfWeek, EPeriodOfTime.WEEK)
            .startOf(EPeriodOfTime.WEEK),
        ),
      ),
    ),
    next: first(
      plannedCheckins.filter(({ createdAt }) =>
        moment(createdAt).isSameOrAfter(
          moment()
            .subtract(numberOfWeek, EPeriodOfTime.WEEK)
            .endOf(EPeriodOfTime.WEEK),
        ),
      ),
    ),
  };
};

const findActualValuePlannedCheckin = (
  numberOfWeek: number,
  plannedCheckins: PlannedCheckinDTO[],
) => {
  const { current, past, next } = findPlannedCheckinForPastWeek(
    numberOfWeek,
    plannedCheckins,
  );
  return current
    ? Math.min(
        current.currentPlannedCheckins,
        current.previousPlannedCheckins,
      ) || current.currentPlannedCheckins
    : past
    ? past.currentPlannedCheckins
    : next.previousPlannedCheckins || next.currentPlannedCheckins;
};

const calcPatientReturnForWeeks = (
  period: EPeriod,
  plannedCheckins: PlannedCheckinDTO[],
  patientReturnDays: Array<{ date: string }>,
): number => {
  const fourWeeksValues: number[] = [];
  for (const numberOfWeek of NumberOfWeeksForPatientReturn[period]) {
    const weekValue = findActualValuePlannedCheckin(
      numberOfWeek,
      plannedCheckins,
    );
    const filteredPatientReturnDays = patientReturnDays.filter(
      ({ date }) =>
        moment(date, 'DD-MM-YYYY').isSameOrAfter(
          moment()
            .subtract(numberOfWeek, EPeriodOfTime.WEEK)
            .startOf(EPeriodOfTime.WEEK),
        ) &&
        moment(date, 'DD-MM-YYYY').isSameOrBefore(
          moment()
            .subtract(numberOfWeek, EPeriodOfTime.WEEK)
            .endOf(EPeriodOfTime.WEEK),
        ),
    );
    fourWeeksValues.push(
      calculatePercentageOfNumber(filteredPatientReturnDays.length, weekValue),
    );
  }
  return +mean(fourWeeksValues).toFixed();
};
