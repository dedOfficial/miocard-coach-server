import isEmpty = require('lodash/isEmpty');
import pick = require('lodash/pick');

import {
  calculateWeeklyValueFromMonth,
  computeAverageValueByStat,
  EPeriodOfTime,
} from 'utils/common';
import {
  DEFAULT_ONE_VALUE,
  DEFAULT_ZERO_VALUE,
  TGetPressureAndPulseFromString,
} from 'utils/common/types';
import { ECardio, getAverageCardioValueForPeriod } from 'utils/stats';
import { EStatsDBKeyName } from 'utils/stats/types';
import {
  EAllowedObjectiveKeyResultTrackingParameters,
  EObjectiveReturnObjectsKey,
  ETypeofOperatorId,
  EHighlightedColor,
} from '../constants';
import { ObjectiveNormValueDto } from '../dto/objectives.dto';
import {
  ICombinedTemplateByMonthParams,
  ICombinedTemplateByWeekAndMonthParams,
  ICombineTemplateByAssistantByWeekAndMonthParams,
  ICombineTemplateByAssistantByWeekAndMonthReturn,
  ICombineTemplateByOperatorByWeekAndMonthParams,
  ICombineTemplateByOperatorByWeekAndMonthReturn,
  ICombineTemplatesByOperatorByMonthParams,
  ICombineTemplatesByOperatorByMonthReturn,
  IGetCheckinProblemsTemplateValue,
  IGetMeasurementTemplateValueProps,
  TGetMeasurementTemplateValueReturn,
  ICountUniqueAmountValuesForPeriod,
  IGetPatientSelfEfficacyTemplateValueParams,
  IGetValueDifferenceByAverageValue,
  TGetAmountOrDefaultValueOfStat,
  TGetPatientSelfEfficacyTemplateValueReturn,
  TGetPercentageDifferenceFromTwoNumbers,
  TGetSystolicAndDiastolicFromCardio,
  ICombineTemplatesCardioByOperatorByWeekAndMonthParamsReturn,
  ICombineTemplatesCardioByOperatorByWeekAndMonthParams,
  ICombinedTemplatesCardioByWeekAndMonthParams,
  ICountValueForSystolicOrDiastolic,
  INDEX_IN_ARRAY_OF_SYSTOLIC_AND_DIASTOLIC,
  ICombineTemplatesByOperatorOrAssistantByWeekAndMonth,
  ICombineTemplatesByOperatorOrAssistantByWeekAndMonthReturn,
  ICombinedTemplatesByWeekAndMonthParams,
  IGetRepeatabilityOfHabitsTemplateValueParams,
  IGetRepeatabilityOfHabitsTemplateValueReturn,
  IGetRecommendationsToFollowTemplateValueParams,
  IGetRecommendationsToFollowTemplateValueReturn,
  IGetPatientReturnTemplateValueProps,
  TGetPercentageValueDifferenceFromHundredPercentParams,
} from './types';
import { OperatorForChat } from 'modules/operator/enums/operators-for-chat.enum';

export const getHighlightedColor = (
  actualValue: number,
  normValue: number,
  isMaxLimit?: boolean,
) => {
  if (normValue > 0) {
    if (isMaxLimit)
      return actualValue > normValue
        ? EHighlightedColor.RED
        : EHighlightedColor.GREEN;
    return actualValue >= normValue
      ? EHighlightedColor.GREEN
      : EHighlightedColor.RED;
  }
  if (normValue <= 0)
    return actualValue > normValue
      ? EHighlightedColor.RED
      : EHighlightedColor.GREEN;

  return EHighlightedColor.BLACK;
};

export const computeAverageValueByTwoValues = (
  firstValue: string | number,
  secondValue: string | number,
) => +(+firstValue / +secondValue).toFixed();

export const getSystolicAndDiastolicFromCardio = ({
  currentPeriodList,
  previousPeriodList,
  systolicNormValue,
  diastolicNormValue,
}: TGetSystolicAndDiastolicFromCardio) => {
  const separateAverageCardioForCurrentPeriod = getAverageCardioValueForPeriod(
    currentPeriodList,
  );
  const separateAverageCardioForPreviousPeriod = getAverageCardioValueForPeriod(
    previousPeriodList,
  );

  const systolic = getAbsoluteValueOrPercentageDifferenceCardio(
    systolicNormValue,
    separateAverageCardioForCurrentPeriod,
    separateAverageCardioForPreviousPeriod,
    ECardio.SYSTOLIC,
  );

  const diastolic = getAbsoluteValueOrPercentageDifferenceCardio(
    diastolicNormValue,
    separateAverageCardioForCurrentPeriod,
    separateAverageCardioForPreviousPeriod,
    ECardio.DIASTOLIC,
  );

  return {
    systolic,
    diastolic,
  };
};

const getAbsoluteValueOrPercentageDifference = (
  firstNormValue: ObjectiveNormValueDto,
  currentPeriodValue: number,
  previousPeriodValue: number,
) =>
  firstNormValue.percentage
    ? getPercentageValueDifferenceFromHundredPercent({
        value: getPercentageDifferenceFromTwoNumbers({
          thisNumber: currentPeriodValue,
          isWhatPercentOfThisNumber: previousPeriodValue,
        }),
        currentPeriodValue,
        previousPeriodValue,
      })
    : currentPeriodValue - previousPeriodValue;

const getAbsoluteValueOrPercentageDifferenceCardio = (
  systolicOrDiastolicNormValue: ObjectiveNormValueDto,
  currentPeriodValue: TGetPressureAndPulseFromString,
  previousPeriodValue: TGetPressureAndPulseFromString,
  type: ECardio,
) =>
  systolicOrDiastolicNormValue.percentage
    ? getPercentageValueDifferenceFromHundredPercent({
        value: getPercentageDifferenceFromTwoNumbers({
          thisNumber: currentPeriodValue[type],
          isWhatPercentOfThisNumber: previousPeriodValue[type],
        }),
        currentPeriodValue: currentPeriodValue[type],
        previousPeriodValue: previousPeriodValue[type],
      })
    : currentPeriodValue[type] - previousPeriodValue[type];

export const getObjectiveKeyResultTemplate = (
  keyName: EStatsDBKeyName | ECardio,
  value: number,
  normValue: ObjectiveNormValueDto,
  isShowNormValue: boolean,
) => ({
  [keyName]: value,
  ...(isShowNormValue && { norm: normValue.value }),
});

export const getValueDifferenceByAverageValue = ({
  firstNormValue,
  currentPeriodList,
  previousPeriodList,
  statDBKeyName,
}: IGetValueDifferenceByAverageValue) => {
  const averageValueForCurrentPeriod = computeAverageValueByStat(
    currentPeriodList,
    statDBKeyName,
  );
  const averageValueForPreviousPeriod = computeAverageValueByStat(
    previousPeriodList,
    statDBKeyName,
  );

  return getAbsoluteValueOrPercentageDifference(
    firstNormValue,
    averageValueForCurrentPeriod,
    averageValueForPreviousPeriod,
  );
};

export const getPercentageDifferenceFromTwoNumbers = ({
  thisNumber,
  isWhatPercentOfThisNumber,
}: TGetPercentageDifferenceFromTwoNumbers) => {
  if (!thisNumber || !isWhatPercentOfThisNumber) {
    return 0;
  }

  return +((thisNumber / isWhatPercentOfThisNumber) * 100).toFixed();
};

export const getPercentageValueDifferenceFromHundredPercent = ({
  value,
  currentPeriodValue,
  previousPeriodValue,
}: TGetPercentageValueDifferenceFromHundredPercentParams) => {
  // // if there are not value for current period, we return 0
  // if (currentPeriodValue < previousPeriodValue) {
  //   return null;
  // }

  // // TODO this case we should fix
  // // if there are not value for previous period, we return 0
  // if (currentPeriodValue > previousPeriodValue) {
  //   return null;
  // }

  // if we do not have value for period, we return 0
  if (!currentPeriodValue || !previousPeriodValue) {
    return 0;
  }

  return value - 100;
};

export const getMeasurementTemplateValue = ({
  chat,
  firstNormValue,
  valueForWeek,
  valueForMonth,
}: IGetMeasurementTemplateValueProps): TGetMeasurementTemplateValueReturn => {
  const { assistantId } = chat;
  const normValueForWeek = calculateWeeklyValueFromMonth(firstNormValue.value);

  return {
    assistantId,
    [EPeriodOfTime.WEEK]: [
      {
        [EObjectiveReturnObjectsKey.ACTUAL]: valueForWeek,
        [EObjectiveReturnObjectsKey.NORM]: normValueForWeek,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          valueForWeek,
          normValueForWeek,
        ),
      },
    ],
    [EPeriodOfTime.MONTH]: [
      {
        [EObjectiveReturnObjectsKey.ACTUAL]: valueForMonth,
        [EObjectiveReturnObjectsKey.NORM]: firstNormValue.value,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          valueForMonth,
          firstNormValue.value,
        ),
      },
    ],
  };
};

export const countUniqueAmountValuesForPeriod = ({
  firstNormValue,
  currentPeriodValue,
  previousPeriodValue,
}: ICountUniqueAmountValuesForPeriod) =>
  firstNormValue.percentage
    ? getPercentageValueDifferenceFromHundredPercent({
        value: getPercentageDifferenceFromTwoNumbers({
          thisNumber: getAmountOrDefaultValueOfStat(currentPeriodValue, true),
          isWhatPercentOfThisNumber: getAmountOrDefaultValueOfStat(
            previousPeriodValue,
            true,
          ),
        }),
        currentPeriodValue: getAmountOrDefaultValueOfStat(
          currentPeriodValue,
          true,
        ),
        previousPeriodValue: getAmountOrDefaultValueOfStat(
          previousPeriodValue,
          true,
        ),
      })
    : getAmountOrDefaultValueOfStat(currentPeriodValue, false);

export const getAmountOrDefaultValueOfStat = (
  statList: Array<TGetAmountOrDefaultValueOfStat>,
  isPercentage: boolean,
) => {
  // if we count percentages, default value will be 1, because we cannot divide by 0
  const defaultValue = isPercentage ? DEFAULT_ONE_VALUE : DEFAULT_ZERO_VALUE;

  return !statList.length ? defaultValue : statList[0].amount;
};

export const getPatientSelfEfficacyTemplateValue = ({
  chat,
  firstNormValue,
}: IGetPatientSelfEfficacyTemplateValueParams): TGetPatientSelfEfficacyTemplateValueReturn => {
  const { selfEfficacy, operatorId } = chat;

  const currentClientSelfEfficacy = firstNormValue.percentage
    ? getPercentageDifferenceFromTwoNumbers({
        thisNumber: selfEfficacy.current - selfEfficacy.previous,
        isWhatPercentOfThisNumber: selfEfficacy.current,
      })
    : selfEfficacy.current;

  return {
    operatorId,
    [EPeriodOfTime.MONTH]: [
      {
        [EObjectiveReturnObjectsKey.ACTUAL]: currentClientSelfEfficacy,
        [EObjectiveReturnObjectsKey.NORM]: firstNormValue.value,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          currentClientSelfEfficacy,
          firstNormValue.value,
        ),
      },
    ],
  };
};

// Case One. Combine template by operator for week and month
export const combineTemplatesByOperatorByWeekAndMonth = ({
  groupedResultByOperatorId,
  operatorsById,
}: ICombineTemplateByOperatorByWeekAndMonthParams): Array<ICombineTemplateByOperatorByWeekAndMonthReturn> =>
  Object.values(groupedResultByOperatorId)
    .map((res) =>
      res.reduce((acc, cur, index, array) => {
        // if name does not exist, we return null and then filter it
        if (!operatorsById[cur.operatorId]?.name.length) {
          return null;
        }

        // we return just first element and operator name
        if (isEmpty(acc)) {
          return { ...cur, name: operatorsById[cur.operatorId]?.name };
        }

        // if the last element, we find average value for the all element
        if (array.length - 1 === index) {
          return combinedTemplatesByWeekAndMonth({
            acc,
            cur,
            operatorsOrAssistantsById: operatorsById,
            wholeArray: array,
            operatorOrAssistantId: ETypeofOperatorId.OPERATOR_ID,
            isLastElement: true,
          });
        }

        // we return each element with adding elements
        return combinedTemplatesByWeekAndMonth({
          acc,
          cur,
          operatorsOrAssistantsById: operatorsById,
          wholeArray: array,
          operatorOrAssistantId: ETypeofOperatorId.OPERATOR_ID,
          isLastElement: false,
        });
      }, {}),
    )
    .filter(Boolean);

// Case Two. Combine template by assistant for week and month
export const combineTemplatesByAssistantByWeekAndMonth = ({
  groupedResultByAssistantId,
  assistantsById,
}: ICombineTemplateByAssistantByWeekAndMonthParams): Array<ICombineTemplateByAssistantByWeekAndMonthReturn> =>
  Object.values(groupedResultByAssistantId)
    .map((res) =>
      res.reduce((acc, cur, index, array) => {
        // if name does not exist, we return null and then filter it
        if (!assistantsById[cur.assistantId]?.name.length) {
          return null;
        }

        // we return just first element and operator name
        if (isEmpty(acc)) {
          return { ...cur, name: assistantsById[cur.assistantId]?.name };
        }

        // if the last element, we find average value for the all element
        if (array.length - 1 === index) {
          return combinedTemplatesByWeekAndMonth({
            acc,
            cur,
            operatorsOrAssistantsById: assistantsById,
            wholeArray: array,
            operatorOrAssistantId: ETypeofOperatorId.ASSISTANT_ID,
            isLastElement: true,
          });
        }

        // we return each element with adding elements
        return combinedTemplatesByWeekAndMonth({
          acc,
          cur,
          operatorsOrAssistantsById: assistantsById,
          wholeArray: array,
          operatorOrAssistantId: ETypeofOperatorId.ASSISTANT_ID,
          isLastElement: false,
        });
      }, {}),
    )
    .filter(Boolean);

// Case Three. Combine template by operator by month
export const combineTemplatesByOperatorByMonth = ({
  groupedResultByOperatorId,
  operatorsById,
}: ICombineTemplatesByOperatorByMonthParams): Array<ICombineTemplatesByOperatorByMonthReturn> =>
  Object.values(groupedResultByOperatorId)
    .map((result) =>
      result.reduce((acc, cur, index, array) => {
        // if name does not exist, we return null and then filter it
        if (!operatorsById[cur.operatorId].name.length) {
          return null;
        }

        // we return just first element and operator name
        if (isEmpty(acc)) {
          return {
            ...cur,
            name: operatorsById[cur.operatorId].name,
          };
        }

        // if the last element, we find average value for the all element
        if (array.length - 1 === index) {
          return combinedTemplatesByMonth({
            acc,
            cur,
            operatorsOrAssistantsById: operatorsById,
            wholeArray: array,
            operatorOrAssistantId: ETypeofOperatorId.OPERATOR_ID,
            isLastElement: true,
          });
        }

        // we return each element with adding elements
        return combinedTemplatesByMonth({
          acc,
          cur,
          operatorsOrAssistantsById: operatorsById,
          wholeArray: array,
          operatorOrAssistantId: ETypeofOperatorId.OPERATOR_ID,
          isLastElement: false,
        });
      }, {}),
    )
    .filter(Boolean);

// Case Four. Combine template Cardio by operator for week and month
export const combineTemplatesCardioByOperatorByWeekAndMonth = ({
  groupedResultByOperatorId,
  operatorsById,
}: ICombineTemplatesCardioByOperatorByWeekAndMonthParams): Array<ICombineTemplatesCardioByOperatorByWeekAndMonthParamsReturn> =>
  Object.values(groupedResultByOperatorId)
    .map((res) =>
      res.reduce((acc, cur, index, array) => {
        // if name does not exist, we return null and then filter it
        if (!operatorsById[cur.operatorId]?.name.length) {
          return null;
        }

        // we return just first element and operator name
        if (isEmpty(acc)) {
          return { ...cur, name: operatorsById[cur.operatorId]?.name };
        }

        // if the last element, we find average value for the all element
        if (array.length - 1 === index) {
          return combinedTemplatesCardioByWeekAndMonth({
            acc,
            cur,
            operatorsOrAssistantsById: operatorsById,
            wholeArray: array,
            operatorOrAssistantId: ETypeofOperatorId.OPERATOR_ID,
            isLastElement: true,
          });
        }

        // we return each element with adding elements
        return combinedTemplatesCardioByWeekAndMonth({
          acc,
          cur,
          operatorsOrAssistantsById: operatorsById,
          wholeArray: array,
          operatorOrAssistantId: ETypeofOperatorId.OPERATOR_ID,
          isLastElement: false,
        });
      }, {}),
    )
    .filter(Boolean);

// Case Five. By Operator or Assistant by week and month
export const combineTemplatesByOperatorOrAssistantByWeekAndMonth = ({
  groupedResultByOperatorId,
  operatorsById,
  operatorOrAssistantId,
}: ICombineTemplatesByOperatorOrAssistantByWeekAndMonth): Array<ICombineTemplatesByOperatorOrAssistantByWeekAndMonthReturn> => {
  return Object.values(groupedResultByOperatorId)
    .map((res) =>
      res.reduce((acc, cur, index, array) => {
        // if name does not exist, we return null and then filter it
        if (!operatorsById[cur[operatorOrAssistantId]]?.name.length) {
          return null;
        }

        // we return just first element and operator name
        if (isEmpty(acc)) {
          return {
            ...cur,
            name: operatorsById[cur[operatorOrAssistantId]]?.name,
          };
        }

        // if the last element, we find average value for the all element
        if (array.length - 1 === index) {
          return combinedTemplatesByOperatorOrAssistantByWeekAndMonth({
            acc,
            cur,
            operatorsOrAssistantsById: operatorsById,
            operatorOrAssistantId,
            wholeArray: array,
            isLastElement: true,
          });
        }

        // we return each element with adding elements
        return combinedTemplatesByOperatorOrAssistantByWeekAndMonth({
          acc,
          cur,
          operatorsOrAssistantsById: operatorsById,
          operatorOrAssistantId,
          wholeArray: array,
          isLastElement: false,
        });
      }, {}),
    )
    .filter(Boolean);
};

// For Case One and Two
// Case One. Combine template by operator for week and month
// Case Two. Combine template by assistant for week and month
const combinedTemplatesByWeekAndMonth = ({
  acc,
  cur,
  operatorsOrAssistantsById,
  wholeArray,
  operatorOrAssistantId,
  isLastElement,
}: ICombinedTemplateByWeekAndMonthParams) => {
  // If the last element true we will count average value for all elements
  const actualValueForWeek = isLastElement
    ? computeAverageValueByTwoValues(
        acc[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL] +
          cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL],
        wholeArray.length,
      )
    : acc[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL];

  const actualValueForMonth = isLastElement
    ? computeAverageValueByTwoValues(
        acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
          cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL],
        wholeArray.length,
      )
    : acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL];

  return {
    ...acc,
    name: operatorsOrAssistantsById[cur[operatorOrAssistantId]]?.name,
    [EPeriodOfTime.WEEK]: [
      {
        ...cur[EPeriodOfTime.WEEK][0],
        [EObjectiveReturnObjectsKey.ACTUAL]: actualValueForWeek,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          actualValueForWeek,
          cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.NORM],
        ),
      },
    ],
    [EPeriodOfTime.MONTH]: [
      {
        ...cur[EPeriodOfTime.MONTH][0],
        [EObjectiveReturnObjectsKey.ACTUAL]: actualValueForMonth,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          actualValueForMonth,
          cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.NORM],
        ),
      },
    ],
  };
};

// For Case Three
// Case Three. Combine template by operator by month
const combinedTemplatesByMonth = ({
  acc,
  cur,
  operatorsOrAssistantsById,
  wholeArray,
  operatorOrAssistantId,
  isLastElement,
}: ICombinedTemplateByMonthParams) => {
  // If the last element true we will count average value for all elements
  const actualValueForMonth = isLastElement
    ? computeAverageValueByTwoValues(
        acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
          cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL],
        wholeArray.length,
      )
    : acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL];

  return {
    ...acc,
    name: operatorsOrAssistantsById[cur[operatorOrAssistantId]]?.name,
    [EPeriodOfTime.MONTH]: [
      {
        ...cur[EPeriodOfTime.MONTH][0],
        [EObjectiveReturnObjectsKey.ACTUAL]: actualValueForMonth,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          actualValueForMonth,
          cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.NORM],
        ),
      },
    ],
  };
};

// For Case Four
// Case Four. Combine template Cardio by operator for week and month
const combinedTemplatesCardioByWeekAndMonth = ({
  acc,
  cur,
  operatorsOrAssistantsById,
  wholeArray,
  isLastElement,
}: ICombinedTemplatesCardioByWeekAndMonthParams) => {
  // If the last element true we will count average value for all elements
  const systolicValueForWeek = countValueForSystolicOrDiastolic({
    acc,
    cur,
    wholeArray,
    isLastElement,
    period: EPeriodOfTime.WEEK,
    systolicOrDiastolic: ECardio.SYSTOLIC,
  });

  const diastolicValueForWeek = countValueForSystolicOrDiastolic({
    acc,
    cur,
    wholeArray,
    isLastElement,
    period: EPeriodOfTime.WEEK,
    systolicOrDiastolic: ECardio.DIASTOLIC,
  });

  const systolicValueForMonth = countValueForSystolicOrDiastolic({
    acc,
    cur,
    wholeArray,
    isLastElement,
    period: EPeriodOfTime.MONTH,
    systolicOrDiastolic: ECardio.SYSTOLIC,
  });

  const diastolicValueForMonth = countValueForSystolicOrDiastolic({
    acc,
    cur,
    wholeArray,
    isLastElement,
    period: EPeriodOfTime.MONTH,
    systolicOrDiastolic: ECardio.DIASTOLIC,
  });

  return {
    ...acc,
    name: operatorsOrAssistantsById[cur.operatorId]?.name,
    [EPeriodOfTime.WEEK]: [
      {
        ...cur[EPeriodOfTime.WEEK][0],
        [ECardio.SYSTOLIC]: systolicValueForWeek,
      },
      {
        ...cur[EPeriodOfTime.WEEK][1],
        [ECardio.DIASTOLIC]: diastolicValueForWeek,
      },
    ],
    [EPeriodOfTime.MONTH]: [
      {
        ...cur[EPeriodOfTime.MONTH][0],
        [ECardio.SYSTOLIC]: systolicValueForMonth,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          systolicValueForMonth,
          cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.NORM],
        ),
      },
      {
        ...cur[EPeriodOfTime.MONTH][1],
        [ECardio.DIASTOLIC]: diastolicValueForMonth,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          diastolicValueForMonth,
          cur[EPeriodOfTime.MONTH][1][EObjectiveReturnObjectsKey.NORM],
        ),
      },
    ],
  };
};

// For Case Five
const combinedTemplatesByOperatorOrAssistantByWeekAndMonth = ({
  acc,
  cur,
  operatorsOrAssistantsById,
  operatorOrAssistantId,
  wholeArray,
  isLastElement,
}: ICombinedTemplatesByWeekAndMonthParams) => {
  // If the last element true we will count average value for all elements
  const actualValueForWeek = isLastElement
    ? computeAverageValueByTwoValues(
        acc[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL] +
          cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL],
        wholeArray.length,
      )
    : acc[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL];

  const actualValueForMonth = isLastElement
    ? computeAverageValueByTwoValues(
        acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
          cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL],
        wholeArray.length,
      )
    : acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL];

  const normOrMaxLimitValueForWeek =
    cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.NORM] ||
    cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.MAX_LIMIT];
  const normOrMaxLimitValueForMonth =
    cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.NORM] ||
    cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.MAX_LIMIT];

  const isMaxLimitForWeek =
    cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.MAX_LIMIT] !==
    undefined;
  const isMaxLimitForMonth =
    cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.MAX_LIMIT] !==
    undefined;

  return {
    ...acc,
    name: operatorsOrAssistantsById[cur[operatorOrAssistantId]]?.name,
    [EPeriodOfTime.WEEK]: [
      {
        ...cur[EPeriodOfTime.WEEK][0],
        [EObjectiveReturnObjectsKey.ACTUAL]: actualValueForWeek,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          actualValueForWeek,
          normOrMaxLimitValueForWeek,
          isMaxLimitForWeek,
        ),
      },
    ],
    [EPeriodOfTime.MONTH]: [
      {
        ...cur[EPeriodOfTime.MONTH][0],
        [EObjectiveReturnObjectsKey.ACTUAL]: actualValueForMonth,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          actualValueForMonth,
          normOrMaxLimitValueForMonth,
          isMaxLimitForMonth,
        ),
      },
    ],
  };
};

const countValueForSystolicOrDiastolic = ({
  acc,
  cur,
  wholeArray,
  isLastElement,
  period,
  systolicOrDiastolic,
}: ICountValueForSystolicOrDiastolic) => {
  const arrayIndex =
    INDEX_IN_ARRAY_OF_SYSTOLIC_AND_DIASTOLIC[systolicOrDiastolic];

  return isLastElement
    ? computeAverageValueByTwoValues(
        acc[period][arrayIndex][systolicOrDiastolic] +
          cur[period][arrayIndex][systolicOrDiastolic],
        wholeArray.length,
      )
    : acc[period][arrayIndex][systolicOrDiastolic] +
        cur[period][arrayIndex][systolicOrDiastolic];
};

export const getRepeatabilityOfHabitsTemplateValue = ({
  operatorId,
  firstNormValue,
  valueForWeek,
  valueForMonth,
}: IGetRepeatabilityOfHabitsTemplateValueParams): IGetRepeatabilityOfHabitsTemplateValueReturn => ({
  operatorId,
  [EPeriodOfTime.WEEK]: [
    {
      [EObjectiveReturnObjectsKey.ACTUAL]: valueForWeek,
    },
  ],
  [EPeriodOfTime.MONTH]: [
    {
      [EObjectiveReturnObjectsKey.ACTUAL]: valueForMonth,
      [EObjectiveReturnObjectsKey.NORM]: firstNormValue.value,
      [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
        valueForMonth,
        firstNormValue.value,
      ),
    },
  ],
});

export const getCheckinProblemsTemplateValue = ({
  operatorOrAssistantId,
  operatorTypeId,
  firstNormValue,
  statValuesForCurrentWeek,
  statValuesForCurrentMonth,
}: IGetCheckinProblemsTemplateValue) => {
  const valueForWeek = statValuesForCurrentWeek.length
    ? statValuesForCurrentWeek[0].amount
    : DEFAULT_ZERO_VALUE;
  const valueForMonth = statValuesForCurrentMonth.length
    ? statValuesForCurrentMonth[0].amount
    : DEFAULT_ZERO_VALUE;
  const normValueForWeek = calculateWeeklyValueFromMonth(firstNormValue.value);
  const isMaxLimit = true;

  return {
    [operatorTypeId]: operatorOrAssistantId,
    [EPeriodOfTime.WEEK]: [
      {
        [EObjectiveReturnObjectsKey.ACTUAL]: valueForWeek,
        [EObjectiveReturnObjectsKey.MAX_LIMIT]: normValueForWeek,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          valueForWeek,
          normValueForWeek,
          isMaxLimit,
        ),
      },
    ],
    [EPeriodOfTime.MONTH]: [
      {
        [EObjectiveReturnObjectsKey.ACTUAL]: valueForMonth,
        [EObjectiveReturnObjectsKey.MAX_LIMIT]: firstNormValue.value,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          valueForMonth,
          firstNormValue.value,
          isMaxLimit,
        ),
      },
    ],
  };
};

export const getRecommendationsToFollowTemplateValue = ({
  operatorId,
  firstNormValue,
  valueForWeek,
  valueForMonth,
}: IGetRecommendationsToFollowTemplateValueParams): IGetRecommendationsToFollowTemplateValueReturn => ({
  operatorId,
  [EPeriodOfTime.WEEK]: [
    {
      [EObjectiveReturnObjectsKey.ACTUAL]: valueForWeek,
    },
  ],
  [EPeriodOfTime.MONTH]: [
    {
      [EObjectiveReturnObjectsKey.ACTUAL]: valueForMonth,
      [EObjectiveReturnObjectsKey.NORM]: firstNormValue.value,
      [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
        valueForMonth,
        firstNormValue.value,
      ),
    },
  ],
});

export const getOperatorOrAssistantData = ({
  operatorId,
  assistantId,
}: {
  operatorId: string;
  assistantId: string;
}) => ({
  [OperatorForChat.COACH]: {
    operatorOrAssistantId: operatorId,
    operatorTypeId: ETypeofOperatorId.OPERATOR_ID,
  },
  [OperatorForChat.ASSISTANT]: {
    operatorOrAssistantId: assistantId,
    operatorTypeId: ETypeofOperatorId.ASSISTANT_ID,
  },
});

export const getPatientReturnTemplateValue = ({
  operatorOrAssistantId,
  operatorTypeId,
  firstNormValue,
  valueForWeek,
  valueForMonth,
}: IGetPatientReturnTemplateValueProps) => {
  return {
    [operatorTypeId]: operatorOrAssistantId,
    [EPeriodOfTime.WEEK]: [
      {
        [EObjectiveReturnObjectsKey.ACTUAL]: valueForWeek,
        [EObjectiveReturnObjectsKey.NORM]: firstNormValue.value,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          valueForWeek,
          firstNormValue.value,
        ),
      },
    ],
    [EPeriodOfTime.MONTH]: [
      {
        [EObjectiveReturnObjectsKey.ACTUAL]: valueForMonth,
        [EObjectiveReturnObjectsKey.NORM]: firstNormValue.value,
        [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
          valueForMonth,
          firstNormValue.value,
        ),
      },
    ],
  };
};

export const countCommonValueForEachStat = ({ type, data }) => {
  if (type === EAllowedObjectiveKeyResultTrackingParameters.BLOOD_PRESSURE) {
    return { type, data: countCommonValueForBloodPressure(data) };
  } else if (
    type ===
    EAllowedObjectiveKeyResultTrackingParameters.BP_MEASUREMENTS_FREQUENCY
  ) {
    return {
      type,
      data: countCommonValueByActualAndNormForWeekAndMonth(data, true),
    };
  } else if (
    type ===
    EAllowedObjectiveKeyResultTrackingParameters.REPEATABILITY_OF_THE_HABITS
  ) {
    return {
      type,
      data: countCommonValueByActualAndNormForWeekAndMonth(data, false),
    };
  } else if (
    type ===
    EAllowedObjectiveKeyResultTrackingParameters['PATIENT_SELF-EFFICACY']
  ) {
    return {
      type,
      data: countCommonValueForSelfEfficacy(data),
    };
  } else if (
    type ===
    EAllowedObjectiveKeyResultTrackingParameters.RECOMMENDATIONS_TO_FOLLOW
  ) {
    return {
      type,
      data: countCommonValueByActualAndNormForWeekAndMonth(data, false),
    };
  } else if (
    type === EAllowedObjectiveKeyResultTrackingParameters.PATIENT_RETURN
  ) {
    return {
      type,
      data: countCommonValueByActualAndNormForWeekAndMonth(data.flat(), true),
    };
  } else if (
    type === EAllowedObjectiveKeyResultTrackingParameters['CHECK-IN_PROBLEMS']
  ) {
    return {
      type,
      data: countCommonValueByActualAndMaxLimitForMonthAndWeek(data.flat()),
    };
  } else {
    return { type, data };
  }
};

// case one
// return for BloodPressure case
const countCommonValueForBloodPressure = (data) => {
  return data.reduce((acc, cur, index, array) => {
    if (isEmpty(acc)) {
      return pick(cur, [EPeriodOfTime.WEEK, EPeriodOfTime.MONTH]);
    }

    const systolicValueForWeek =
      acc[EPeriodOfTime.WEEK][0][ECardio.SYSTOLIC] +
      cur[EPeriodOfTime.WEEK][0][ECardio.SYSTOLIC];

    const diastolicValueForWeek =
      acc[EPeriodOfTime.WEEK][1][ECardio.DIASTOLIC] +
      cur[EPeriodOfTime.WEEK][1][ECardio.DIASTOLIC];

    const systolicValueForMonth =
      acc[EPeriodOfTime.MONTH][0][ECardio.SYSTOLIC] +
      cur[EPeriodOfTime.MONTH][0][ECardio.SYSTOLIC];

    const diastolicValueForMonth =
      acc[EPeriodOfTime.MONTH][1][ECardio.DIASTOLIC] +
      cur[EPeriodOfTime.MONTH][1][ECardio.DIASTOLIC];

    // if the last element, we find average value for the all element
    if (array.length - 1 === index) {
      const averageSystolicValueForMonth = computeAverageValueByTwoValues(
        systolicValueForMonth,
        array.length,
      );
      const averageDiastolicValueForMonth = computeAverageValueByTwoValues(
        diastolicValueForMonth,
        array.length,
      );
      const systolicNormValueForMonth =
        cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.NORM];
      const diastolicNormValueForMonth =
        cur[EPeriodOfTime.MONTH][1][EObjectiveReturnObjectsKey.NORM];

      return {
        [EPeriodOfTime.WEEK]: [
          {
            [ECardio.SYSTOLIC]: computeAverageValueByTwoValues(
              systolicValueForWeek,
              array.length,
            ),
          },
          {
            [ECardio.DIASTOLIC]: computeAverageValueByTwoValues(
              diastolicValueForWeek,
              array.length,
            ),
          },
        ],
        [EPeriodOfTime.MONTH]: [
          {
            [ECardio.SYSTOLIC]: averageSystolicValueForMonth,
            [EObjectiveReturnObjectsKey.NORM]: systolicNormValueForMonth,
            [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
              averageSystolicValueForMonth,
              systolicNormValueForMonth,
            ),
          },
          {
            [ECardio.DIASTOLIC]: averageDiastolicValueForMonth,
            [EObjectiveReturnObjectsKey.NORM]: diastolicNormValueForMonth,
            [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
              averageDiastolicValueForMonth,
              diastolicNormValueForMonth,
            ),
          },
        ],
      };
    }

    return {
      [EPeriodOfTime.WEEK]: [
        {
          [ECardio.SYSTOLIC]: systolicValueForWeek,
        },
        {
          [ECardio.DIASTOLIC]: diastolicValueForWeek,
        },
      ],
      [EPeriodOfTime.MONTH]: [
        {
          [ECardio.SYSTOLIC]: systolicValueForMonth,
        },
        {
          [ECardio.DIASTOLIC]: diastolicValueForMonth,
        },
      ],
    };
  }, {});
};

// case two
// return Actual and Norm for each Week and Month
// if isNormForWeek: true, we return Actual and Norm for Month and partly for Week
const countCommonValueByActualAndNormForWeekAndMonth = (
  data,
  isNormForWeek: boolean,
) => {
  return data.reduce((acc, cur, index, array) => {
    if (isEmpty(acc)) {
      return pick(cur, [EPeriodOfTime.WEEK, EPeriodOfTime.MONTH]);
    }

    const valueForWeek =
      acc[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL];

    const valueForMonth =
      acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL];

    // if the last element, we find average value for the all element
    if (array.length - 1 === index) {
      const averageValueForWeek = computeAverageValueByTwoValues(
        valueForWeek,
        array.length,
      );
      const averageValueForMonth = computeAverageValueByTwoValues(
        valueForMonth,
        array.length,
      );

      const normValueForWeek =
        cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.NORM];
      const normValueForMonth =
        cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.NORM];

      return {
        [EPeriodOfTime.WEEK]: [
          {
            [EObjectiveReturnObjectsKey.ACTUAL]: averageValueForWeek,
            // if isNormForWeek is true, we return Norm value for Week too
            ...(isNormForWeek && {
              [EObjectiveReturnObjectsKey.NORM]: normValueForWeek,
              [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
                averageValueForWeek,
                normValueForWeek,
              ),
            }),
          },
        ],
        [EPeriodOfTime.MONTH]: [
          {
            [EObjectiveReturnObjectsKey.ACTUAL]: averageValueForMonth,
            [EObjectiveReturnObjectsKey.NORM]: normValueForMonth,
            [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
              averageValueForMonth,
              normValueForMonth,
            ),
          },
        ],
      };
    }

    return {
      [EPeriodOfTime.WEEK]: [
        {
          [EObjectiveReturnObjectsKey.ACTUAL]: valueForWeek,
        },
      ],
      [EPeriodOfTime.MONTH]: [
        {
          [EObjectiveReturnObjectsKey.ACTUAL]: valueForMonth,
        },
      ],
    };
  }, {});
};

// case two
// return Actual and Max Limit for each Week and Month
const countCommonValueByActualAndMaxLimitForMonthAndWeek = (data) => {
  return data.reduce((acc, cur, index, array) => {
    if (isEmpty(acc)) {
      return pick(cur, [EPeriodOfTime.WEEK, EPeriodOfTime.MONTH]);
    }

    const valueForWeek =
      acc[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.ACTUAL];

    const valueForMonth =
      acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL];

    // if the last element, we find average value for the all element
    if (array.length - 1 === index) {
      const averageValueForWeek = computeAverageValueByTwoValues(
        valueForWeek,
        array.length,
      );
      const averageValueForMonth = computeAverageValueByTwoValues(
        valueForMonth,
        array.length,
      );
      const limitValueForWeek =
        cur[EPeriodOfTime.WEEK][0][EObjectiveReturnObjectsKey.MAX_LIMIT];
      const limitValueForMonth =
        cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.MAX_LIMIT];
      const isMaxLimit = true;

      return {
        [EPeriodOfTime.WEEK]: [
          {
            [EObjectiveReturnObjectsKey.ACTUAL]: averageValueForWeek,
            [EObjectiveReturnObjectsKey.MAX_LIMIT]: limitValueForWeek,
            [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
              averageValueForWeek,
              limitValueForWeek,
              isMaxLimit,
            ),
          },
        ],
        [EPeriodOfTime.MONTH]: [
          {
            [EObjectiveReturnObjectsKey.ACTUAL]: averageValueForMonth,
            [EObjectiveReturnObjectsKey.MAX_LIMIT]: limitValueForMonth,
            [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
              averageValueForMonth,
              limitValueForMonth,
              isMaxLimit,
            ),
          },
        ],
      };
    }

    return {
      [EPeriodOfTime.WEEK]: [
        {
          [EObjectiveReturnObjectsKey.ACTUAL]: valueForWeek,
        },
      ],
      [EPeriodOfTime.MONTH]: [
        {
          [EObjectiveReturnObjectsKey.ACTUAL]: valueForMonth,
        },
      ],
    };
  }, {});
};

// return for SelfEfficacy case
const countCommonValueForSelfEfficacy = (data) => {
  return data.reduce((acc, cur, index, array) => {
    if (isEmpty(acc)) {
      return pick(cur, [EPeriodOfTime.MONTH]);
    }

    const valueForMonth =
      acc[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL] +
      cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.ACTUAL];

    // if the last element, we find average value for the all element
    if (array.length - 1 === index) {
      const averageValueForMonth = computeAverageValueByTwoValues(
        valueForMonth,
        array.length,
      );
      const normValueForMonth =
        cur[EPeriodOfTime.MONTH][0][EObjectiveReturnObjectsKey.NORM];

      return {
        [EPeriodOfTime.MONTH]: [
          {
            [EObjectiveReturnObjectsKey.ACTUAL]: averageValueForMonth,
            [EObjectiveReturnObjectsKey.NORM]: normValueForMonth,
            [EObjectiveReturnObjectsKey.HIGHLIGHTED]: getHighlightedColor(
              averageValueForMonth,
              normValueForMonth,
            ),
          },
        ],
      };
    }

    return {
      [EPeriodOfTime.MONTH]: [
        {
          [EObjectiveReturnObjectsKey.ACTUAL]: valueForMonth,
        },
      ],
    };
  }, {});
};
