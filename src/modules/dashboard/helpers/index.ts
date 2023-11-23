import { InternalServerErrorException } from '@nestjs/common';

import {
  calculateWeeklyValueFromMonth,
  computeAverageCardio,
  computeAverageValueByStat,
  EPeriod,
  EPeriodOfTime,
  getMaxCardio,
} from 'utils/common';
import { DEFAULT_ZERO_VALUE } from 'utils/common/types';
import {
  EDashboardBlockHighlight,
  EDashboardBlocksTitle,
  EDashboardCategoryTitle,
  EDashboardTitle,
  EDashboardType,
} from '../constants';
import { EStatsDBKeyName } from 'utils/stats/types';
import { getCheckinProblemsAmount } from 'utils/checkin';
import {
  IDashboardBlock,
  IDashboardCategory,
  TCombineDashboardTemplate,
  TCreateDashboardBlock,
  TDrugsRequests,
  TGetCardioDashboardBlocks,
  TGetCheckinDashboardBlocks,
  TGetMeasurementsDashboardBlocks,
  TGetWeightDashboardBlocks,
  THabitsRequests,
  TOperatorDashboardTemplateWithMultipleValues,
  TRecommendationsRequests,
} from './types';
import { ChatSelfEfficacyDto } from 'modules/operator/dto/update-chat.dto';
import { WeightDocument } from '../../stats/models/weight.model';
import { CardioDocument } from '../../stats/models/cardio.model';
import { CheckinDocument } from '../../stats/models/checkin.model';
import { TrackedParametersDocument } from '../../trackedParameters/models/tracked_parameters.model';
import { Query } from 'mongoose';
import { TDashboardTemplate, TDashboardTemplateBlock } from './types';
import {
  ENormGuides,
  SOMETHING_WENT_WRONG_ERROR,
} from '../../trackedParameters/constants';
import { trackingParameterBlockTemplate } from '../../trackedParameters/helpers';
import { DrugDocument } from '../../stats/models/drug.model';
import { EAllowedDrugValues } from '../../stats/constants';
export const getWeightData = (
  weightRequests: (Promise<WeightDocument> | Promise<WeightDocument[]>)[],
) =>
  Promise.all<WeightDocument | WeightDocument[]>(weightRequests)
    .then((weightData) => {
      const [
        lastClientWeightData,
        clientWeightForCurrentMonthData,
        clientWeightForPreviousMonthData,
        maxWeightOnProjectForPreviousWeekData,
        maxWeightOnProjectForPreviousMonthData,
        weightOnProjectForWeekData,
        weightOnProjectForMonthData,
      ] = weightData;

      const lastClientWeight = lastClientWeightData
        ? +lastClientWeightData[EStatsDBKeyName.WEIGHT]
        : 0;

      const averageClientWeightForCurrentMonth = (clientWeightForCurrentMonthData as WeightDocument[])
        .length
        ? computeAverageValueByStat(
            clientWeightForCurrentMonthData as WeightDocument[],
            EStatsDBKeyName.WEIGHT,
          )
        : DEFAULT_ZERO_VALUE;

      const averageClientWeightForPreviousMonth = (clientWeightForPreviousMonthData as WeightDocument[])
        .length
        ? computeAverageValueByStat(
            clientWeightForPreviousMonthData as WeightDocument[],
            EStatsDBKeyName.WEIGHT,
          )
        : DEFAULT_ZERO_VALUE;

      const maxWeightOnProjectForPreviousWeek = maxWeightOnProjectForPreviousWeekData
        ? +maxWeightOnProjectForPreviousWeekData[EStatsDBKeyName.WEIGHT]
        : DEFAULT_ZERO_VALUE;

      const maxWeightOnProjectForPreviousMonth = maxWeightOnProjectForPreviousMonthData
        ? +maxWeightOnProjectForPreviousMonthData[EStatsDBKeyName.WEIGHT]
        : DEFAULT_ZERO_VALUE;

      const averageWeightOnProjectForWeek = (weightOnProjectForWeekData as WeightDocument[])
        .length
        ? computeAverageValueByStat(
            weightOnProjectForWeekData as WeightDocument[],
            EStatsDBKeyName.WEIGHT,
          )
        : DEFAULT_ZERO_VALUE;

      const averageWeightOnProjectForMonth = (weightOnProjectForMonthData as WeightDocument[])
        .length
        ? computeAverageValueByStat(
            weightOnProjectForMonthData as WeightDocument[],
            EStatsDBKeyName.WEIGHT,
          )
        : DEFAULT_ZERO_VALUE;

      return {
        lastClientWeight,
        averageClientWeightForCurrentMonth,
        averageClientWeightForPreviousMonth,
        maxWeightOnProjectForPreviousWeek,
        maxWeightOnProjectForPreviousMonth,
        averageWeightOnProjectForWeek,
        averageWeightOnProjectForMonth,
      };
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'weight',
      );
    });

export const getCardioData = (
  cardioRequests: (Promise<CardioDocument[]> | Promise<CardioDocument>)[],
) =>
  Promise.all<CardioDocument | CardioDocument[]>(cardioRequests)
    .then((cardioData) => {
      const [
        clientCardioForPreviousWeekData,
        clientCardioForPreviousMonthData,
        maxCardioOnProjectForPreviousWeekData,
        maxCardioOnProjectForPreviousMonthData,
        allCardioOnProjectForPreviousWeekData,
        allCardioOnProjectForPreviousMonth,
      ] = cardioData;

      const averageClientCardioForPreviousWeek = computeAverageCardio(
        clientCardioForPreviousWeekData as CardioDocument[],
      );

      const averageClientCardioForPreviousMonth = computeAverageCardio(
        clientCardioForPreviousMonthData as CardioDocument[],
      );

      const maxCardioOnProjectForPreviousWeek = getMaxCardio(
        maxCardioOnProjectForPreviousWeekData as CardioDocument,
      );

      const maxCardioOnProjectForPreviousMonth = getMaxCardio(
        maxCardioOnProjectForPreviousMonthData as CardioDocument,
      );

      const averageCardioOnProjectForPreviousWeek = computeAverageCardio(
        allCardioOnProjectForPreviousWeekData as CardioDocument[],
      );

      const averageCardioOnProjectForPreviousMonth = computeAverageCardio(
        allCardioOnProjectForPreviousMonth as CardioDocument[],
      );

      return {
        averageClientCardioForPreviousWeek,
        averageClientCardioForPreviousMonth,
        maxCardioOnProjectForPreviousWeek,
        maxCardioOnProjectForPreviousMonth,
        averageCardioOnProjectForPreviousWeek,
        averageCardioOnProjectForPreviousMonth,
      };
    })
    .catch((error) => {
      console.log(error);
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'cardio',
      );
    });

export const getWeightDashboardBlocks = (
  weightData: TGetWeightDashboardBlocks,
) => {
  const {
    clientWeight,
    lastClientWeight,
    averageClientWeightForCurrentMonth,
    averageClientWeightForPreviousMonth,
    maxWeightOnProjectForPreviousWeek,
    maxWeightOnProjectForPreviousMonth,
    averageWeightOnProjectForWeek,
    averageWeightOnProjectForMonth,
  } = weightData;

  return [
    // last client Weight
    dashboardBlockTemplate({
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.RECOMMENDED_BY_DOCTOR_IBS,
          value: clientWeight.recommended,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.LAST_MEASURED_LBS,
          value: +lastClientWeight,
          highlighted: getHighlightedValue(
            lastClientWeight,
            clientWeight.recommended,
          ),
        }),
      ],
    }),
    // average client Weight for current month
    // average client Weight for previous month
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.AVERAGE_LBS,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.THIS_MONTH,
          value: averageClientWeightForCurrentMonth,
          highlighted: getHighlightedValue(
            averageClientWeightForCurrentMonth,
            clientWeight.recommended,
          ),
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_MONTH,
          value: averageClientWeightForPreviousMonth,
          highlighted: getHighlightedValue(
            averageClientWeightForPreviousMonth,
            clientWeight.recommended,
          ),
        }),
      ],
    }),
    // max Weight on the project for previous week
    // max Weight on the project for previous month
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.MAX_WEIGHT_ON_PROJECT_LBS,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_WEEK,
          value: maxWeightOnProjectForPreviousWeek,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_MONTH,
          value: maxWeightOnProjectForPreviousMonth,
        }),
      ],
    }),
    // average Weight on whole project for week
    // average Weight on whole project for month
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.AVERAGE_WEIGHT_ON_PROJECT_LBS,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_WEEK,
          value: averageWeightOnProjectForWeek,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_MONTH,
          value: averageWeightOnProjectForMonth,
        }),
      ],
    }),
  ];
};

export const getCardioDashboardBlocks = (
  cardioData: TGetCardioDashboardBlocks,
) => {
  const {
    clientHeartRate,
    clientBloodPressure,
    averageClientCardioForPreviousWeek,
    averageClientCardioForPreviousMonth,
    maxCardioOnProjectForPreviousWeek,
    maxCardioOnProjectForPreviousMonth,
    averageCardioOnProjectForPreviousWeek,
    averageCardioOnProjectForPreviousMonth,
  } = cardioData;

  const { recommended, comfortable } = clientBloodPressure;

  const recommendedByDoctor =
    recommended.sys === 0
      ? null
      : `${recommended.sys}/${recommended.dia} ${clientHeartRate.recommended}`;
  const comfortableForClient =
    comfortable.sys === 0
      ? null
      : `${comfortable.sys}/${comfortable.dia} ${clientHeartRate.comfortable}`;

  const highlightedForPreviousWeek = getHighlightedValue(
    splitCardioValue(averageClientCardioForPreviousWeek),
    calculateWeeklyValueFromMonth(comfortable.sys),
  );

  const highlightedForPreviousMonth = getHighlightedValue(
    splitCardioValue(averageClientCardioForPreviousMonth),
    comfortable.sys,
  );

  return [
    // Cardio comfortable for client
    dashboardBlockTemplate({
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.RECOMMENDED_BY_DOCTOR,
          value: recommendedByDoctor,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.COMFORTABLE_FOR_CLIENT,
          value: comfortableForClient,
        }),
      ],
    }),
    // average client Cardio for previous week
    // average client Cardio for previous month
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.AVERAGE,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_WEEK,
          value: averageClientCardioForPreviousWeek,
          highlighted: highlightedForPreviousWeek,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_MONTH,
          value: averageClientCardioForPreviousMonth,
          highlighted: highlightedForPreviousMonth,
        }),
      ],
    }),
    // max Cardio on the project for previous week
    // max Cardio on the project for previous month
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.MAX_VALUE_ON_THE_PROJECT,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_WEEK,
          value: maxCardioOnProjectForPreviousWeek,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_MONTH,
          value: maxCardioOnProjectForPreviousMonth,
        }),
      ],
    }),
    //
    // average Cardio on the whole project for previous week
    // average Cardio on the whole project for previous month
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.AVERAGE_ON_THE_WHOLE_PROJECT,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_WEEK,
          value: averageCardioOnProjectForPreviousWeek,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_MONTH,
          value: averageCardioOnProjectForPreviousMonth,
        }),
      ],
    }),
  ];
};

export const getCheckinData = (checkinRequests: Promise<CheckinDocument[]>[]) =>
  Promise.all<CheckinDocument[]>(checkinRequests)
    .then((checkinData) => {
      const [
        clientCheckinForCurrentWeekData,
        clientCheckinForCurrentMonthData,
      ] = checkinData;

      const checkinProblemsAmountForWeek = getCheckinProblemsAmount(
        clientCheckinForCurrentWeekData,
      );
      const checkinProblemsAmountForMonth = getCheckinProblemsAmount(
        clientCheckinForCurrentMonthData,
      );

      const completedSessionsForCurrentWeek =
        clientCheckinForCurrentWeekData.length;
      const completedSessionsForCurrentMonth =
        clientCheckinForCurrentMonthData.length;

      return {
        checkinProblemsAmountForWeek,
        completedSessionsForCurrentWeek,
        checkinProblemsAmountForMonth,
        completedSessionsForCurrentMonth,
      };
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'checkins',
      );
    });

export const getCheckinDashboardBlocks = (
  checkinData: TGetCheckinDashboardBlocks,
) => {
  const {
    checkinProblemsAmountForWeek,
    completedSessionsForCurrentWeek,
    maxLimitForWeek,
    checkinProblemsAmountForMonth,
    completedSessionsForCurrentMonth,
    maxLimitForMonth,
  } = checkinData;

  return [
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.WEEKLY_TIMES,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PROBLEMS,
          value: checkinProblemsAmountForWeek,
          highlighted: getHighlightedValue(
            checkinProblemsAmountForWeek,
            maxLimitForWeek,
          ),
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.COMPLETED_SESSIONS,
          value: completedSessionsForCurrentWeek,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.MAX_LIMIT,
          value: maxLimitForWeek,
        }),
      ],
    }),
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.MONTHLY_TIMES,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PROBLEMS,
          value: checkinProblemsAmountForMonth,
          highlighted: getHighlightedValue(
            checkinProblemsAmountForMonth,
            maxLimitForMonth,
          ),
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.COMPLETED_SESSIONS,
          value: completedSessionsForCurrentMonth,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.MAX_LIMIT,
          value: maxLimitForMonth,
        }),
      ],
    }),
  ];
};

export const getSelfEfficacyDashboardBlocks = (
  selfEfficacyData: ChatSelfEfficacyDto,
) => {
  const { current, previous, norm } = selfEfficacyData;

  return [
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.POINTS_RECEIVED,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.CURRENT_RESULT,
          value: current,
          highlighted: getHighlightedValue(current, norm),
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_RESULT,
          value: previous,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.NORM,
          value: norm,
        }),
      ],
    }),
  ];
};

export const getMeasurementsData = (
  measurementsRequests: (
    | Query<TrackedParametersDocument, TrackedParametersDocument>
    | Promise<CardioDocument[]>
  )[],
) =>
  Promise.all<TrackedParametersDocument | CardioDocument[]>(
    measurementsRequests,
  )
    .then((measurementsData) => {
      const [
        trackedParameterData,
        measurementsForCurrentWeekData,
        measurementsForPreviousWeekData,
        measurementsForCurrentMonthData,
        measurementsForPreviousMonthData,
      ] = measurementsData;

      const measurementsWeeklyNorm = trackedParameterData
        ? calculateWeeklyValueFromMonth(
            (trackedParameterData as TrackedParametersDocument).value,
          )
        : DEFAULT_ZERO_VALUE;

      const measurementsMonthlyNorm = trackedParameterData
        ? (trackedParameterData as TrackedParametersDocument).value
        : DEFAULT_ZERO_VALUE;

      return {
        measurementsWeeklyNorm,
        measurementsMonthlyNorm,
        measurementsForCurrentWeek: (measurementsForCurrentWeekData as CardioDocument[])
          .length,
        measurementsForPreviousWeek: (measurementsForPreviousWeekData as CardioDocument[])
          .length,
        measurementsForCurrentMonth: (measurementsForCurrentMonthData as CardioDocument[])
          .length,
        measurementsForPreviousMonth: (measurementsForPreviousMonthData as CardioDocument[])
          .length,
      };
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'measurements',
      );
    });

export const getMeasurementsDashboardBlocks = (
  measurementsData: TGetMeasurementsDashboardBlocks,
) => {
  const {
    measurementsWeeklyNorm,
    measurementsMonthlyNorm,
    measurementsForCurrentWeek,
    measurementsForPreviousWeek,
    measurementsForCurrentMonth,
    measurementsForPreviousMonth,
  } = measurementsData;

  return [
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.WEEKLY_MEASUREMENTS_DAYS,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.THIS_WEEK,
          value: measurementsForCurrentWeek,
          highlighted: getHighlightedBPMeasurementValue(
            measurementsForCurrentWeek,
            measurementsWeeklyNorm,
          ),
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_WEEK,
          value: measurementsForPreviousWeek,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.NORM,
          value: measurementsWeeklyNorm,
        }),
      ],
    }),
    dashboardBlockTemplate({
      title: EDashboardBlocksTitle.MONTHLY_MEASUREMENTS_DAYS,
      categories: [
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.THIS_MONTH,
          value: measurementsForCurrentMonth,
          highlighted: getHighlightedBPMeasurementValue(
            measurementsForCurrentMonth,
            measurementsMonthlyNorm,
          ),
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.PREVIOUS_MONTH,
          value: measurementsForPreviousMonth,
        }),
        dashboardCategoryTemplate({
          title: EDashboardCategoryTitle.NORM,
          value: measurementsMonthlyNorm,
        }),
      ],
    }),
  ];
};

export const createDashboardBlock = (
  data: TCreateDashboardBlock,
  reverse = false,
) => {
  const {
    blockTitle,
    firstCategoryTitle,
    firstValue,
    secondCategoryTitle,
    secondValue,
    thirdCategoryTitle,
    thirdValue,
  } = data;

  return dashboardBlockTemplate({
    title: blockTitle,
    categories: [
      dashboardCategoryTemplate({
        title: firstCategoryTitle,
        value: firstValue,
        highlighted: getHighlightedValue(firstValue, thirdValue, reverse),
      }),
      dashboardCategoryTemplate({
        title: secondCategoryTitle,
        value: secondValue,
      }),
      dashboardCategoryTemplate({
        title: thirdCategoryTitle,
        value: thirdValue,
      }),
    ],
  });
};

export const createSmallDashboardBlock = (data: TCreateDashboardBlock) => {
  const {
    blockTitle,
    firstCategoryTitle,
    firstValue,
    secondCategoryTitle,
    secondValue,
  } = data;

  return dashboardBlockTemplate({
    title: blockTitle,
    categories: [
      dashboardCategoryTemplate({
        title: firstCategoryTitle,
        value: firstValue,
        highlighted: getHighlightedValue(firstValue, secondValue, true),
      }),
      dashboardCategoryTemplate({
        title: secondCategoryTitle,
        value: secondValue,
      }),
    ],
  });
};

export const getHabitDashboards = (habitsRequests: THabitsRequests) =>
  Promise.all(habitsRequests)
    .then((habitsData) => {
      return habitsData.map((habitData) => {
        const {
          currentHabit,
          habitsDataForCurrentWeek,
          habitsDataForPreviousWeek,
          habitsDataForCurrentMonth,
          habitsDataForPreviousMonth,
        } = habitData;

        const habitSumValueForCurrentWeek = computeSumValue(
          habitsDataForCurrentWeek,
        );

        const habitSumValueForPreviousWeek = computeSumValue(
          habitsDataForPreviousWeek,
        );

        const habitSumValueForCurrentMonth = computeSumValue(
          habitsDataForCurrentMonth,
        );

        const habitSumValueForPreviousMonth = computeSumValue(
          habitsDataForPreviousMonth,
        );

        const dashboardForWeek = createDashboardBlock({
          blockTitle: EDashboardBlocksTitle.WEEKLY_INTAKE_TIMES,
          firstCategoryTitle: EDashboardCategoryTitle.THIS_WEEK,
          firstValue: habitSumValueForCurrentWeek,
          secondCategoryTitle: EDashboardCategoryTitle.PREVIOUS_WEEK,
          secondValue: habitSumValueForPreviousWeek,
          thirdCategoryTitle: EDashboardCategoryTitle.MAX_LIMIT,
          thirdValue: calculateWeeklyValueFromMonth(currentHabit.limit),
        });

        const dashboardForMonth = createDashboardBlock({
          blockTitle: EDashboardBlocksTitle.MONTHLY_INTAKE_TIMES,
          firstCategoryTitle: EDashboardCategoryTitle.THIS_MONTH,
          firstValue: habitSumValueForCurrentMonth,
          secondCategoryTitle: EDashboardCategoryTitle.PREVIOUS_MONTH,
          secondValue: habitSumValueForPreviousMonth,
          thirdCategoryTitle: EDashboardCategoryTitle.MAX_LIMIT,
          thirdValue: currentHabit.limit,
        });

        return dashboardTemplate(currentHabit.name, EDashboardType.SMALL, [
          dashboardForWeek,
          dashboardForMonth,
        ]);
      });
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'habits',
      );
    });

export const getRecommendationDashboards = (
  recommendationsRequests: TRecommendationsRequests,
) =>
  Promise.all(recommendationsRequests)
    .then((recommendationsData) => {
      return recommendationsData.map((recommendationData) => {
        const {
          currentRecommendation,
          recommendationsDataForCurrentWeek,
          recommendationsDataForPreviousWeek,
          recommendationsDataForCurrentMonth,
          recommendationsDataForPreviousMonth,
        } = recommendationData;

        const recommendationSumValueForCurrentWeek = computeSumValue(
          recommendationsDataForCurrentWeek,
        );

        const recommendationSumValueForPreviousWeek = computeSumValue(
          recommendationsDataForPreviousWeek,
        );

        const recommendationSumValueForCurrentMonth = computeSumValue(
          recommendationsDataForCurrentMonth,
        );

        const recommendationSumValueForPreviousMonth = computeSumValue(
          recommendationsDataForPreviousMonth,
        );

        const dashboardForWeek = createDashboardBlock(
          {
            blockTitle: EDashboardBlocksTitle.WEEKLY_REPETITIONS_TIMES,
            firstCategoryTitle: EDashboardCategoryTitle.THIS_WEEK,
            firstValue: recommendationSumValueForCurrentWeek,
            secondCategoryTitle: EDashboardCategoryTitle.PREVIOUS_WEEK,
            secondValue: recommendationSumValueForPreviousWeek,
            thirdCategoryTitle: EDashboardCategoryTitle.MIN_NORM,
            thirdValue: calculateWeeklyValueFromMonth(
              currentRecommendation.min,
            ),
          },
          true,
        );

        const dashboardForMonth = createDashboardBlock(
          {
            blockTitle: EDashboardBlocksTitle.MONTHLY_REPETITIONS_TIMES,
            firstCategoryTitle: EDashboardCategoryTitle.THIS_MONTH,
            firstValue: recommendationSumValueForCurrentMonth,
            secondCategoryTitle: EDashboardCategoryTitle.PREVIOUS_MONTH,
            secondValue: recommendationSumValueForPreviousMonth,
            thirdCategoryTitle: EDashboardCategoryTitle.MIN_NORM,
            thirdValue: currentRecommendation.min,
          },
          true,
        );

        return dashboardTemplate(
          currentRecommendation.name,
          EDashboardType.SMALL,
          [dashboardForWeek, dashboardForMonth],
        );
      });
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'recommendations',
      );
    });

export const getDrugsDashboards = (drugsRequests: TDrugsRequests) =>
  Promise.all(drugsRequests)
    .then((drugsData) => {
      return drugsData.map((drugData) => {
        const {
          currentDrug,
          drugsDataForCurrentWeek,
          drugsDataForPreviousWeek,
          drugsDataForCurrentMonth,
          drugsDataForPreviousMonth,
        } = drugData;

        const drugSumValueForCurrentWeek = computeSumDrugsValue(
          drugsDataForCurrentWeek,
        );

        const drugSumValueForPreviousWeek = computeSumDrugsValue(
          drugsDataForPreviousWeek,
        );

        const drugSumValueForCurrentMonth = computeSumDrugsValue(
          drugsDataForCurrentMonth,
        );

        const drugSumValueForPreviousMonth = computeSumDrugsValue(
          drugsDataForPreviousMonth,
        );

        const dashboardForWeek = createSmallDashboardBlock({
          blockTitle: EDashboardBlocksTitle.WEEKLY_INTAKE_TIMES,
          firstCategoryTitle: EDashboardCategoryTitle.THIS_WEEK,
          firstValue: drugSumValueForCurrentWeek,
          secondCategoryTitle: EDashboardCategoryTitle.PREVIOUS_WEEK,
          secondValue: drugSumValueForPreviousWeek,
        });

        const dashboardForMonth = createSmallDashboardBlock({
          blockTitle: EDashboardBlocksTitle.MONTHLY_INTAKE_TIMES,
          firstCategoryTitle: EDashboardCategoryTitle.THIS_MONTH,
          firstValue: drugSumValueForCurrentMonth,
          secondCategoryTitle: EDashboardCategoryTitle.PREVIOUS_MONTH,
          secondValue: drugSumValueForPreviousMonth,
        });

        return dashboardTemplate(currentDrug.name, EDashboardType.SMALL, [
          dashboardForWeek,
          dashboardForMonth,
        ]);
      });
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'drugs',
      );
    });

export const dashboardTemplate = (
  title: EDashboardTitle | string,
  type: EDashboardType,
  blocks: TDashboardTemplateBlock[],
): TDashboardTemplate => {
  return {
    title,
    description: '',
    type,
    blocks,
  };
};

export const combineDashboardTemplate = (
  title: EDashboardTitle | string,
  type: EDashboardType,
  blocks: TDashboardTemplate[],
): TCombineDashboardTemplate => {
  return {
    title,
    description: '',
    type,
    blocks,
  };
};

export const dashboardBlockTemplate = ({
  title,
  categories,
}: IDashboardBlock) => {
  const mappedCategories = categories.map((category) => ({
    title: category.title,
    value: category.value,
    ...(category.highlighted && { highlighted: category.highlighted }),
  }));

  return {
    ...(title && { title }),
    categories: mappedCategories,
  };
};

export const dashboardCategoryTemplate = ({
  title,
  value,
  highlighted,
}: IDashboardCategory) => {
  return {
    ...(highlighted && { highlighted }),
    title,
    value,
  };
};

export const computeSumValue = (stats) =>
  +stats.reduce((acc, cur) => acc + +cur.repeatability, 0).toFixed();

export const computeSumDrugsValue = (drugs: DrugDocument[]) =>
  drugs.filter((drug) => drug.drug === EAllowedDrugValues.TAKEN).length;

export const getHighlightedValue = (
  firstValue: number,
  secondValue: number,
  reverse = false,
) => {
  if (reverse)
    return firstValue < secondValue
      ? EDashboardBlockHighlight.RED
      : firstValue > secondValue
      ? EDashboardBlockHighlight.GREEN
      : null;
  return firstValue > secondValue
    ? EDashboardBlockHighlight.RED
    : firstValue < secondValue
    ? EDashboardBlockHighlight.GREEN
    : null;
};

export const getHighlightedBPMeasurementValue = (
  firstValue: number,
  secondValue: number,
) =>
  firstValue < secondValue
    ? EDashboardBlockHighlight.RED
    : firstValue > secondValue
    ? EDashboardBlockHighlight.GREEN
    : null;

export const splitCardioValue = (cardio: string | null): number | null =>
  cardio ? +cardio.split('/')[0] : null;

export const habitsOperatorDashboard = (habitsRequests: THabitsRequests) => {
  return Promise.all(habitsRequests)
    .then((habitsData) => {
      return habitsData.map((habitData) => {
        const {
          currentHabit,
          habitsDataForCurrentWeek,
          habitsDataForPreviousWeek,
          habitsDataForCurrentMonth,
          habitsDataForPreviousMonth,
        } = habitData;

        const habitSumValueForCurrentWeek = computeSumValue(
          habitsDataForCurrentWeek,
        );

        const habitSumValueForPreviousWeek = computeSumValue(
          habitsDataForPreviousWeek,
        );

        const habitSumValueForCurrentMonth = computeSumValue(
          habitsDataForCurrentMonth,
        );

        const habitSumValueForPreviousMonth = computeSumValue(
          habitsDataForPreviousMonth,
        );

        return {
          name: currentHabit.name,
          statistics: trackingParameterBlockTemplate(
            habitSumValueForCurrentWeek,
            habitSumValueForPreviousWeek,
            habitSumValueForCurrentMonth,
            habitSumValueForPreviousMonth,
            currentHabit.limit,
            ENormGuides.MAX_LIMIT,
            false,
          ),
        };
      });
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'habits',
      );
    });
};

export const recommendationsOperatorDashboard = (
  recommendationsRequests: TRecommendationsRequests,
) => {
  return Promise.all(recommendationsRequests)
    .then((recommendationsData) => {
      return recommendationsData.map((recommendationData) => {
        const {
          currentRecommendation,
          recommendationsDataForCurrentWeek,
          recommendationsDataForPreviousWeek,
          recommendationsDataForCurrentMonth,
          recommendationsDataForPreviousMonth,
        } = recommendationData;

        const recommendationSumValueForCurrentWeek = computeSumValue(
          recommendationsDataForCurrentWeek,
        );

        const recommendationSumValueForPreviousWeek = computeSumValue(
          recommendationsDataForPreviousWeek,
        );

        const recommendationSumValueForCurrentMonth = computeSumValue(
          recommendationsDataForCurrentMonth,
        );

        const recommendationSumValueForPreviousMonth = computeSumValue(
          recommendationsDataForPreviousMonth,
        );

        return {
          name: currentRecommendation.name,
          statistics: trackingParameterBlockTemplate(
            recommendationSumValueForCurrentWeek,
            recommendationSumValueForPreviousWeek,
            recommendationSumValueForCurrentMonth,
            recommendationSumValueForPreviousMonth,
            currentRecommendation.min,
            ENormGuides.MIN_NORM,
            false,
          ),
        };
      });
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'recommendations',
      );
    });
};

export const drugsOperatorDashboard = (drugsRequests: TDrugsRequests) => {
  return Promise.all(drugsRequests)
    .then((drugsData) => {
      return drugsData.map((drugData) => {
        const {
          currentDrug,
          drugsDataForCurrentWeek,
          drugsDataForCurrentMonth,
          drugsDataForPreviousMonth,
          drugsDataForPreviousWeek,
        } = drugData;

        const drugSumValueForCurrentWeek = computeSumDrugsValue(
          drugsDataForCurrentWeek,
        );

        const drugSumValueForPreviousWeek = computeSumDrugsValue(
          drugsDataForPreviousWeek,
        );

        const drugSumValueForCurrentMonth = computeSumDrugsValue(
          drugsDataForCurrentMonth,
        );

        const drugSumValueForPreviousMonth = computeSumDrugsValue(
          drugsDataForPreviousMonth,
        );

        return {
          name: currentDrug.name,
          statistics: [
            {
              period: EPeriodOfTime.WEEK,
              [EPeriod.CURRENT]: drugSumValueForCurrentWeek,
              [EPeriod.PREVIOUS]: drugSumValueForPreviousWeek,
              highlight: getHighlightedValue(
                drugSumValueForCurrentWeek,
                drugSumValueForPreviousWeek,
                true,
              ),
            },
            {
              period: EPeriodOfTime.MONTH,
              [EPeriod.CURRENT]: drugSumValueForCurrentMonth,
              [EPeriod.PREVIOUS]: drugSumValueForPreviousMonth,
              highlight: getHighlightedValue(
                drugSumValueForCurrentMonth,
                drugSumValueForPreviousMonth,
                true,
              ),
            },
          ],
        };
      });
    })
    .catch(() => {
      throw new InternalServerErrorException(
        SOMETHING_WENT_WRONG_ERROR + 'recommendations',
      );
    });
};

export const calcDifferencePeriodValues = (
  dashboards: TOperatorDashboardTemplateWithMultipleValues[],
) => {
  const weeklyDifference = dashboards.reduce(
    (acc, dashboard) =>
      acc +
      dashboard.data.reduce(
        (acc2, item) =>
          acc2 + item.statistics[0].current - item.statistics[0].previous,
        0,
      ),
    0,
  );

  const monthlyDifference = dashboards.reduce(
    (acc, dashboard) =>
      acc +
      dashboard.data.reduce(
        (acc2, item) =>
          acc2 + item.statistics[1].current - item.statistics[1].previous,
        0,
      ),
    0,
  );
  return {
    statistics: [
      {
        period: EPeriodOfTime.WEEK,
        difference: weeklyDifference,
      },
      {
        period: EPeriodOfTime.MONTH,
        difference: monthlyDifference,
      },
    ],
  };
};
