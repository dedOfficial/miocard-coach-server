import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { OperatorService } from 'modules/operator/operator.service';
import {
  GetDashboardDto,
  GetOperatorDashboardDto,
} from './dto/get-dashboard.dto';
import { StatsService } from 'modules/stats/stats.service';
import {
  calculateWeeklyValueFromMonth,
  EPeriod,
  EPeriodOfTime,
} from 'utils/common';
import { EStatsDBKeyName, EStatsModels } from 'utils/stats/types';
import {
  calcDifferencePeriodValues,
  combineDashboardTemplate,
  dashboardTemplate,
  getCardioDashboardBlocks,
  getCardioData,
  getCheckinDashboardBlocks,
  getCheckinData,
  getDrugsDashboards,
  getHabitDashboards,
  getMeasurementsDashboardBlocks,
  getMeasurementsData,
  getRecommendationDashboards,
  getSelfEfficacyDashboardBlocks,
  getWeightDashboardBlocks,
  getWeightData,
} from './helpers';
import {
  EDashboardTitle,
  EDashboardType,
  ETitleOperatorDashboard,
} from './constants';
import { DEFAULT_ZERO_VALUE } from 'utils/common/types';
import { TrackedParametersService } from 'modules/trackedParameters/trackedParameters.service';
import {
  EAllowedTrackedParameters,
  TRACKED_PARAMETER_NOT_FOUND_ERROR,
} from 'modules/trackedParameters/constants';
import { WeightDocument } from '../stats/models/weight.model';
import { CardioDocument } from '../stats/models/cardio.model';
import { CheckinDocument } from '../stats/models/checkin.model';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly operatorService: OperatorService,
    private readonly statsService: StatsService,
    private readonly trackedParametersService: TrackedParametersService,
  ) {}

  @UseGuards(new JwtAuthGuard())
  @Get(':chatId')
  @UsePipes(new ValidationPipe())
  async getDashboard(@Param() { chatId }: GetDashboardDto) {
    const chat = await this.operatorService.findChatById(chatId);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const {
      clientNumber,
      selfEfficacy,
      weight: clientWeight,
      heartRate: clientHeartRate,
      bloodPressure: clientBloodPressure,
      habits,
      recommendations,
      drugs,
    } = chat;

    // BP and heart rate
    //
    // client Cardio for previous week
    const getClientCardioForPreviousWeek = (): Promise<CardioDocument[]> =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
        EStatsModels.CARDIO_MODEL,
      );

    // client Cardio for previous month
    const getClientCardioForPreviousMonth = (): Promise<CardioDocument[]> =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
        EStatsModels.CARDIO_MODEL,
      );

    // max weight on the project for previous week
    const getMaxCardioOnProjectForPreviousWeek = (): Promise<CardioDocument> =>
      this.statsService.getMaxStatValueByPeriod(
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
        EStatsModels.CARDIO_MODEL,
        EStatsDBKeyName.PRESSURE,
      ) as Promise<CardioDocument>;

    // max all weight on the project for previous month
    const getMaxCardioOnProjectForPreviousMonth = (): Promise<CardioDocument> =>
      this.statsService.getMaxStatValueByPeriod(
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
        EStatsModels.CARDIO_MODEL,
        EStatsDBKeyName.PRESSURE,
      ) as Promise<CardioDocument>;

    // all Cardio on project for previous week
    const getAllCardioOnProjectForPreviousWeek = (): Promise<
      CardioDocument[]
    > =>
      this.statsService.getStatValuesByPeriod(
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
        EStatsModels.CARDIO_MODEL,
      );

    // all Cardio on project for previous month
    const getAllCardioOnProjectForPreviousMonth = (): Promise<
      CardioDocument[]
    > =>
      this.statsService.getStatValuesByPeriod(
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
        EStatsModels.CARDIO_MODEL,
      );

    const cardioRequests = [
      getClientCardioForPreviousWeek(),
      getClientCardioForPreviousMonth(),
      getMaxCardioOnProjectForPreviousWeek(),
      getMaxCardioOnProjectForPreviousMonth(),
      getAllCardioOnProjectForPreviousWeek(),
      getAllCardioOnProjectForPreviousMonth(),
    ];

    const cardioData = await getCardioData(cardioRequests);
    const cardioDashboardBlocks = getCardioDashboardBlocks({
      clientHeartRate,
      clientBloodPressure,
      ...cardioData,
    });
    const cardioDashboard = dashboardTemplate(
      EDashboardTitle.BP_AND_HEART_RATE,
      EDashboardType.LARGE,
      cardioDashboardBlocks,
    );

    // Body weight
    //
    // last client Weight
    const getLastClientWeight = (): Promise<WeightDocument> =>
      this.statsService.getLastAddedClientStat(
        clientNumber,
        EStatsModels.WEIGHT_MODEL,
      ) as Promise<WeightDocument>;

    // client Weight for current month
    const getClientWeightForCurrentMonth = (): Promise<WeightDocument[]> =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.CURRENT,
        EPeriodOfTime.MONTH,
        EStatsModels.WEIGHT_MODEL,
      );

    // client Weight for previous month
    const getClientWeightForPreviousMonth = (): Promise<WeightDocument[]> =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
        EStatsModels.WEIGHT_MODEL,
      );

    // max all Weight on the project for previous week
    const getMaxWeightOnProjectForPreviousWeek = (): Promise<WeightDocument> =>
      this.statsService.getMaxStatValueByPeriod(
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
        EStatsModels.WEIGHT_MODEL,
        EStatsDBKeyName.WEIGHT,
      ) as Promise<WeightDocument>;

    // max all Weight on the project for previous month
    const getMaxWeightOnProjectForPreviousMonth = (): Promise<WeightDocument> =>
      this.statsService.getMaxStatValueByPeriod(
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
        EStatsModels.WEIGHT_MODEL,
        EStatsDBKeyName.WEIGHT,
      ) as Promise<WeightDocument>;

    // average Weight on whole project for week
    const getAllWeightOnProjectForWeek = (): Promise<WeightDocument[]> =>
      this.statsService.getStatValuesByPeriod(
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
        EStatsModels.WEIGHT_MODEL,
      );

    // average Weight on whole project for month
    const getAllWeightOnProjectForMonth = (): Promise<WeightDocument[]> =>
      this.statsService.getStatValuesByPeriod(
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
        EStatsModels.WEIGHT_MODEL,
      );

    const weightRequests = [
      getLastClientWeight(),
      getClientWeightForCurrentMonth(),
      getClientWeightForPreviousMonth(),
      getMaxWeightOnProjectForPreviousWeek(),
      getMaxWeightOnProjectForPreviousMonth(),
      getAllWeightOnProjectForWeek(),
      getAllWeightOnProjectForMonth(),
    ];

    const weightData = await getWeightData(weightRequests);
    const weightDashboardBlocks = getWeightDashboardBlocks({
      clientWeight,
      ...weightData,
    });
    const weightDashboard = dashboardTemplate(
      EDashboardTitle.BODY_WEIGHT,
      EDashboardType.LARGE,
      weightDashboardBlocks,
    );

    // Habits
    //

    const habitsRequests = this.dashboardService.getHabitsByClientNumber(
      habits,
      clientNumber,
    );

    const habitsDashboards = await getHabitDashboards(habitsRequests);

    const combineHabitDashboards = combineDashboardTemplate(
      EDashboardTitle.REPETITIONS_OF_BAD_HABITS,
      EDashboardType.SMALL_MULTIPLE,
      habitsDashboards,
    );

    // Recommendations
    //
    const recommendationsRequests = this.dashboardService.getRecommendationsByClientNumber(
      recommendations,
      clientNumber,
    );

    const recommendationsDashboards = await getRecommendationDashboards(
      recommendationsRequests,
    );

    const combineRecommendationDashboards = combineDashboardTemplate(
      EDashboardTitle.RECOMMENDATIONS_TO_FOLLOW,
      EDashboardType.SMALL_MULTIPLE,
      recommendationsDashboards,
    );

    // Medications
    //

    const medicationsRequests = this.dashboardService.getDrugsByClientNumber(
      drugs,
      clientNumber,
    );

    const medicationsDashboards = await getDrugsDashboards(medicationsRequests);

    const combineMedicationDashboards = combineDashboardTemplate(
      EDashboardTitle.MEDICATION_INTAKE,
      EDashboardType.SMALL_MULTIPLE,
      medicationsDashboards,
    );

    // BP measurement frequency
    //
    const getTrackedParameter = () =>
      this.trackedParametersService.findTrackedParameter(
        EAllowedTrackedParameters.BP_MEASUREMENTS_CONTROL,
      );

    const getMeasurementsForCurrentWeek = () =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.WEEK,
        EPeriod.CURRENT,
      );

    const getMeasurementsForPreviousWeek = () =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.WEEK,
        EPeriod.PREVIOUS,
      );

    const getMeasurementsForCurrentMonth = () =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.MONTH,
        EPeriod.CURRENT,
      );

    const getMeasurementsForPreviousMonth = () =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.MONTH,
        EPeriod.PREVIOUS,
      );

    const measurementsRequests = [
      getTrackedParameter(),
      getMeasurementsForCurrentWeek(),
      getMeasurementsForPreviousWeek(),
      getMeasurementsForCurrentMonth(),
      getMeasurementsForPreviousMonth(),
    ];

    const measurementsData = await getMeasurementsData(measurementsRequests);
    const measurementsDashboardBlocks = getMeasurementsDashboardBlocks(
      measurementsData,
    );

    const measurementsDashboard = dashboardTemplate(
      EDashboardTitle.BP_MEASUREMENTS_FREQUENCY,
      EDashboardType.SMALL,
      measurementsDashboardBlocks,
    );

    // Check-in problems
    //
    const checkinProblems = await this.trackedParametersService.findTrackedParameter(
      EAllowedTrackedParameters.CHECKIN_PROBLEMS,
    );

    const maxLimitForMonth = checkinProblems.value ?? DEFAULT_ZERO_VALUE;

    const maxLimitForWeek =
      calculateWeeklyValueFromMonth(maxLimitForMonth) ?? DEFAULT_ZERO_VALUE;

    const getClientCheckinForCurrentWeek = (): Promise<CheckinDocument[]> =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.CURRENT,
        EPeriodOfTime.WEEK,
        EStatsModels.CHECKIN_MODEL,
      );

    const getClientCheckinForCurrentMonth = (): Promise<CheckinDocument[]> =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.CURRENT,
        EPeriodOfTime.MONTH,
        EStatsModels.CHECKIN_MODEL,
      );

    const checkinRequests = [
      getClientCheckinForCurrentWeek(),
      getClientCheckinForCurrentMonth(),
    ];

    const checkinData = await getCheckinData(checkinRequests);
    const checkinDashboardBlocks = getCheckinDashboardBlocks({
      ...checkinData,
      maxLimitForWeek,
      maxLimitForMonth,
    });
    const checkinDashboard = dashboardTemplate(
      EDashboardTitle.CHECKIN_PROBLEMS,
      EDashboardType.SMALL,
      checkinDashboardBlocks,
    );

    // Self-efficacy test result
    //
    const selfEfficacyDashboardBlocks = getSelfEfficacyDashboardBlocks(
      selfEfficacy,
    );
    const selfEfficacyDashboard = dashboardTemplate(
      EDashboardTitle.SELF_EFFICACY_TEST_RESULT,
      EDashboardType.SMALL,
      selfEfficacyDashboardBlocks,
    );

    return [
      cardioDashboard,
      weightDashboard,
      combineHabitDashboards,
      combineRecommendationDashboards,
      combineMedicationDashboards,
      measurementsDashboard,
      checkinDashboard,
      selfEfficacyDashboard,
    ];
  }

  @UseGuards(new JwtAuthGuard())
  @Get('operator/:operatorId')
  @UsePipes(new ValidationPipe())
  async getOperatorDashboard(@Param() { operatorId }: GetOperatorDashboardDto) {
    try {
      const operator = await this.operatorService.findOperatorById(operatorId);

      const chats = await this.operatorService.findAllActiveChatsById(
        operatorId,
      );

      const patientReturnParameter = await this.trackedParametersService.findTrackedParameter(
        EAllowedTrackedParameters.PATIENT_RETURN,
      );

      const dataCollectionParameter = await this.trackedParametersService.findTrackedParameter(
        EAllowedTrackedParameters.DATA_COLLECTION,
      );

      const measurementsParameter = await this.trackedParametersService.findTrackedParameter(
        EAllowedTrackedParameters.BP_MEASUREMENTS_CONTROL,
      );

      const checkinProblemsParameter = await this.trackedParametersService.findTrackedParameter(
        EAllowedTrackedParameters.CHECKIN_PROBLEMS,
      );

      if (
        !patientReturnParameter ||
        !dataCollectionParameter ||
        !measurementsParameter ||
        !checkinProblemsParameter
      ) {
        throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
      }

      const patientReturn = await this.trackedParametersService.getAveragePatientReturnByCoach(
        operator._id,
        operator.name,
        patientReturnParameter.value,
        chats,
      );

      const dataCollection = await this.trackedParametersService.getAverageDataCollectionByCoach(
        operator._id,
        operator.name,
        dataCollectionParameter.value,
        chats,
      );

      const measurements = await this.trackedParametersService.getAverageMeasurementsByCoach(
        operator._id,
        operator.name,
        measurementsParameter.value,
        chats,
      );

      const checkinProblems = await this.trackedParametersService.getAverageCheckinProblemsByCoach(
        operator._id,
        operator.name,
        checkinProblemsParameter.value,
        chats,
      );

      const habitsDashboards = await this.dashboardService.getHabitsForOperatorDashboard(
        operator._id,
      );

      const recommendationsDashboards = await this.dashboardService.getRecommendationsForOperatorDashboard(
        operator._id,
      );

      const drugsDashboards = await this.dashboardService.getDrugsForOperatorDashboard(
        operator._id,
      );

      return [
        {
          title: ETitleOperatorDashboard.DATA_COLLECTION,
          data: dataCollection,
        },
        {
          title: ETitleOperatorDashboard.PATIENT_RETURN,
          data: patientReturn,
        },
        {
          title: ETitleOperatorDashboard.CHECKIN_PROBLEMS,
          data: checkinProblems,
        },
        {
          title: ETitleOperatorDashboard.MEASUREMENTS,
          data: measurements,
        },
        {
          title: ETitleOperatorDashboard.HABITS,
          data: calcDifferencePeriodValues(habitsDashboards),
        },
        {
          title: ETitleOperatorDashboard.RECOMMENDATIONS,
          data: calcDifferencePeriodValues(recommendationsDashboards),
        },
        {
          title: ETitleOperatorDashboard.MEDICATIONS,
          data: calcDifferencePeriodValues(drugsDashboards),
        },
      ];
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(new JwtAuthGuard())
  @Get('operator/habits/:operatorId')
  @UsePipes(new ValidationPipe())
  async getHabitsOperatorDashboard(
    @Param() { operatorId }: GetOperatorDashboardDto,
  ) {
    return this.dashboardService.getHabitsForOperatorDashboard(operatorId);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('operator/recommendations/:operatorId')
  @UsePipes(new ValidationPipe())
  async getRecommendationsOperatorDashboard(
    @Param() { operatorId }: GetOperatorDashboardDto,
  ) {
    return this.dashboardService.getRecommendationsForOperatorDashboard(
      operatorId,
    );
  }

  @UseGuards(new JwtAuthGuard())
  @Get('operator/drugs/:operatorId')
  @UsePipes(new ValidationPipe())
  async getDrugsOperatorDashboard(
    @Param() { operatorId }: GetOperatorDashboardDto,
  ) {
    return this.dashboardService.getDrugsForOperatorDashboard(operatorId);
  }
}
