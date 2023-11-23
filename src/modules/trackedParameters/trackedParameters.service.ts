import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Cardio, CardioDocument } from 'modules/stats/models/cardio.model';
import {
  Tracked_parameters,
  TrackedParametersDocument,
} from './models/tracked_parameters.model';
import { TrackedParametersDto } from './dto/trackedParameters.dto';
import {
  Data_tracked_parameters,
  DataTrackedParametersDocument,
} from './models/data_tracked_parameters.model';
import { PlannedCheckinDTO } from './dto/dataTrackedParameters.dto';
import {
  CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR,
  DEFAULT_CHECKIN_PROBLEMS_TRACKED_PARAMETER,
  DEFAULT_TRACKED_PARAMETER_STAT_VALUE,
  EAllowedTemplateBlockType,
  EAllowedTrackedParameters,
  ENormGuides,
  TRACKED_PARAMETER_NOT_FOUND_ERROR,
} from './constants';
import {
  calcPatientReturn,
  countDataCollectionByChat,
  countDataCollectionByOperator,
  countPatientReturnByOperator,
  countStatsByChats,
  countStatsByCheckinProblems,
  countStatsByCheckinProblemsForByOperator,
  getFillingSuccessByChatByPeriod,
  getValueByPeriod,
  trackingParameterBlockTemplate,
} from './helpers';
import { EPeriod, EPeriodOfTime } from '../../utils/common';
import { TTrackedParameterByCoach } from './helpers/types';
import { ChatService } from '../chat/chat.service';
import { StatsService } from '../stats/stats.service';
import { EStatsModels } from '../../utils/stats/types';
import { ChatDocument } from '../operator/models/chat.model';

@Injectable()
export class TrackedParametersService {
  constructor(
    @InjectModel(Cardio.name) private cardioModel: Model<CardioDocument>,
    @InjectModel(Tracked_parameters.name)
    private parameterModel: Model<TrackedParametersDocument>,
    @InjectModel(Data_tracked_parameters.name)
    private dataTrackedParametersModel: Model<DataTrackedParametersDocument>,
    private readonly chatService: ChatService,
    private readonly statsService: StatsService,
  ) {}

  findTrackedParameter(
    trackingParameter: TrackedParametersDto['trackingParameter'],
  ) {
    return this.parameterModel.findOne({
      trackingParameter,
    });
  }

  createTrackedParameter(parameter: TrackedParametersDto) {
    return this.parameterModel
      .findOneAndUpdate(
        { trackingParameter: parameter.trackingParameter },
        parameter,
        { upsert: true, useFindAndModify: false },
      )
      .exec();
  }

  getPlannedCheckin(chatId: string) {
    return this.dataTrackedParametersModel.findOne(
      { chatId },
      { plannedCheckins: true },
    );
  }

  async setPlannedCheckin({
    chatId,
    newValue,
    oldValue,
  }: {
    chatId: string;
    newValue: number;
    oldValue?: number;
  }) {
    try {
      const data = await this.dataTrackedParametersModel.findOne({
        chatId,
      });

      const newPlannedCheckin: PlannedCheckinDTO = {
        currentPlannedCheckins: newValue,
        previousPlannedCheckins: oldValue ?? newValue,
        createdAt: new Date(),
      };

      await this.dataTrackedParametersModel.findOneAndUpdate(
        { chatId },
        {
          $set: {
            plannedCheckins: !!data?.plannedCheckins?.length
              ? data?.plannedCheckins.concat(newPlannedCheckin)
              : [newPlannedCheckin],
          },
        },
        { upsert: true, useFindAndModify: false },
      );
    } catch (error) {
      throw new HttpException(error, HttpStatus.FORBIDDEN);
    }
  }

  async getAverageMeasurementsByCoach(
    _id: string,
    name: string,
    minNorm: number,
    chats: ChatDocument[],
  ) {
    if (!chats.length) {
      return DEFAULT_TRACKED_PARAMETER_STAT_VALUE(
        name,
        _id,
        minNorm,
        ENormGuides.MIN_NORM,
        false,
        EAllowedTemplateBlockType.COACH,
      );
    }

    const savedChatsNames = {};
    const savedShortKeys = {};

    const requestsForCurrentWeek = chats.map(
      ({ clientNumber, dummyName, shortKey }) => {
        savedChatsNames[clientNumber] = dummyName;
        savedShortKeys[clientNumber] = shortKey;

        return this.statsService.findCardioStatByClientNumberAndDate(
          clientNumber,
          EPeriodOfTime.WEEK,
          EPeriod.CURRENT,
        );
      },
    );

    const requestsForPreviousWeek = chats.map(({ clientNumber }) =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.WEEK,
        EPeriod.PREVIOUS,
      ),
    );

    const requestsForCurrentMonth = chats.map(({ clientNumber }) =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.MONTH,
        EPeriod.CURRENT,
      ),
    );

    const requestsForPreviousMonth = chats.map(({ clientNumber }) =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.MONTH,
        EPeriod.PREVIOUS,
      ),
    );

    const statsByChats = await countStatsByChats(
      chats,
      savedChatsNames,
      savedShortKeys,
      {
        requestsForCurrentWeek,
        requestsForPreviousWeek,
        requestsForCurrentMonth,
        requestsForPreviousMonth,
      },
      minNorm,
    );

    return statsByChats.reduce((acc, cur) => {
      const week = getValueByPeriod(acc, cur, EPeriodOfTime.WEEK);
      const month = getValueByPeriod(acc, cur, EPeriodOfTime.MONTH);

      return {
        name,
        operatorId: _id,
        statistics: trackingParameterBlockTemplate(
          week.accCurrentPeriod + week.curCurrentPeriod,
          week.accPreviousPeriod + week.cutPreviousPeriod,
          month.accCurrentPeriod + month.curCurrentPeriod,
          month.accPreviousPeriod + month.cutPreviousPeriod,
          minNorm,
          ENormGuides.MIN_NORM,
          false,
        ),
      };
    }, DEFAULT_TRACKED_PARAMETER_STAT_VALUE(name, _id, minNorm, ENormGuides.MIN_NORM, false, EAllowedTemplateBlockType.COACH));
  }

  async getMeasurementsByCoachChats(chats: ChatDocument[]) {
    const trackedParameter = await this.findTrackedParameter(
      EAllowedTrackedParameters.BP_MEASUREMENTS_CONTROL,
    );

    if (!trackedParameter) {
      throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
    }

    const minNorm = trackedParameter.value;

    const savedChatsNames = {};
    const savedShortKeys = {};

    const requestsForCurrentWeek = chats.map(
      ({ clientNumber, dummyName, shortKey }) => {
        savedChatsNames[clientNumber] = dummyName;
        savedShortKeys[clientNumber] = shortKey;

        return this.statsService.findCardioStatByClientNumberAndDate(
          clientNumber,
          EPeriodOfTime.WEEK,
          EPeriod.CURRENT,
        );
      },
    );

    const requestsForPreviousWeek = chats.map(({ clientNumber }) =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.WEEK,
        EPeriod.PREVIOUS,
      ),
    );

    const requestsForCurrentMonth = chats.map(({ clientNumber }) =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.MONTH,
        EPeriod.CURRENT,
      ),
    );

    const requestsForPreviousMonth = chats.map(({ clientNumber }) =>
      this.statsService.findCardioStatByClientNumberAndDate(
        clientNumber,
        EPeriodOfTime.MONTH,
        EPeriod.PREVIOUS,
      ),
    );

    const statsByChats = await countStatsByChats(
      chats,
      savedChatsNames,
      savedShortKeys,
      {
        requestsForCurrentWeek,
        requestsForPreviousWeek,
        requestsForCurrentMonth,
        requestsForPreviousMonth,
      },
      minNorm,
    );

    // TODO replace mock data (minNorm and percentage)
    return {
      chats: statsByChats,
      percentage: trackedParameter ? trackedParameter.percentage : false,
    };
  }

  async getAverageCheckinProblemsByCoach(
    _id: string,
    name: string,
    maxLimit: number,
    chats: ChatDocument[],
  ) {
    if (!chats.length) {
      // if the current operator does not have any chat, we return empty template
      return DEFAULT_CHECKIN_PROBLEMS_TRACKED_PARAMETER(_id, name, maxLimit);
    }

    const requestsForCurrentWeek = chats.map(({ clientNumber }) =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.CURRENT,
        EPeriodOfTime.WEEK,
        EStatsModels.CHECKIN_MODEL,
      ),
    );

    const requestsForCurrentMonth = chats.map(({ clientNumber }) =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.CURRENT,
        EPeriodOfTime.MONTH,
        EStatsModels.CHECKIN_MODEL,
      ),
    );

    return await countStatsByCheckinProblemsForByOperator(name, _id, maxLimit, {
      requestsForCurrentWeek,
      requestsForCurrentMonth,
    });
  }

  async getCheckinProblemsByCoachChats(chats: ChatDocument[]) {
    const trackedParameter = await this.findTrackedParameter(
      EAllowedTrackedParameters.CHECKIN_PROBLEMS,
    );

    if (!trackedParameter) {
      throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
    }

    const maxLimit = trackedParameter.value;

    const savedChatsNames = [];

    const requestsForCurrentWeek = chats.map(
      ({ clientNumber, dummyName, _id, shortKey }) => {
        savedChatsNames.push({ _id, dummyName, shortKey });

        return this.statsService.getStatValuesByClientByPeriod(
          clientNumber,
          EPeriod.CURRENT,
          EPeriodOfTime.WEEK,
          EStatsModels.CHECKIN_MODEL,
        );
      },
    );

    const requestsForCurrentMonth = chats.map(({ clientNumber }) =>
      this.statsService.getStatValuesByClientByPeriod(
        clientNumber,
        EPeriod.CURRENT,
        EPeriodOfTime.MONTH,
        EStatsModels.CHECKIN_MODEL,
      ),
    );

    return countStatsByCheckinProblems(savedChatsNames, maxLimit, {
      requestsForCurrentWeek,
      requestsForCurrentMonth,
    });
  }

  async getAverageDataCollectionByCoach(
    _id: string,
    name: string,
    minNorm: number,
    chats: ChatDocument[],
  ): Promise<TTrackedParameterByCoach> {
    if (!chats.length) {
      // if the current operator does not have any chat, we return empty template
      return DEFAULT_TRACKED_PARAMETER_STAT_VALUE(
        name,
        _id,
        minNorm,
        ENormGuides.MIN_NORM,
        true,
        EAllowedTemplateBlockType.COACH,
      ) as TTrackedParameterByCoach;
    }

    const valuesForCurrentWeek = chats.map((chat) =>
      getFillingSuccessByChatByPeriod(
        chat,
        EPeriod.CURRENT,
        EPeriodOfTime.WEEK,
      ),
    );

    const valuesForPreviousWeek = chats.map((chat) =>
      getFillingSuccessByChatByPeriod(
        chat,
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
      ),
    );

    const valuesForCurrentMonth = chats.map((chat) =>
      getFillingSuccessByChatByPeriod(
        chat,
        EPeriod.CURRENT,
        EPeriodOfTime.MONTH,
      ),
    );

    const valuesForPreviousMonth = chats.map((chat) =>
      getFillingSuccessByChatByPeriod(
        chat,
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
      ),
    );

    return countDataCollectionByOperator(
      valuesForCurrentWeek,
      valuesForPreviousWeek,
      valuesForCurrentMonth,
      valuesForPreviousMonth,
      _id,
      name,
      minNorm,
    );
  }

  async getDataCollectionByCoachChats(chats: ChatDocument[]) {
    const trackedParameter = await this.findTrackedParameter(
      EAllowedTrackedParameters.DATA_COLLECTION,
    );

    if (!trackedParameter) {
      throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
    }

    const minNorm = trackedParameter.value;

    const fillingSuccessByChats = chats.map((chat) => ({
      name: chat.dummyName,
      shortKey: chat.shortKey,
      values: {
        currentWeek: getFillingSuccessByChatByPeriod(
          chat,
          EPeriod.CURRENT,
          EPeriodOfTime.WEEK,
        ),
        previousWeek: getFillingSuccessByChatByPeriod(
          chat,
          EPeriod.PREVIOUS,
          EPeriodOfTime.WEEK,
        ),
        currentMonth: getFillingSuccessByChatByPeriod(
          chat,
          EPeriod.CURRENT,
          EPeriodOfTime.MONTH,
        ),
        previousMonth: getFillingSuccessByChatByPeriod(
          chat,
          EPeriod.PREVIOUS,
          EPeriodOfTime.MONTH,
        ),
      },
    }));

    return {
      chats: countDataCollectionByChat(fillingSuccessByChats, minNorm),
    };
  }

  async getAveragePatientReturnByCoach(
    _id: string,
    name: string,
    minNorm: number,
    chats: ChatDocument[],
  ): Promise<TTrackedParameterByCoach> {
    if (!chats.length) {
      // if the current operator does not have any chat, we return empty template
      return DEFAULT_TRACKED_PARAMETER_STAT_VALUE(
        name,
        _id,
        minNorm,
        ENormGuides.MIN_NORM,
        true,
        EAllowedTemplateBlockType.COACH,
      ) as TTrackedParameterByCoach;
    }

    const valuesForCurrentWeek: number[] = [];
    const valuesForPreviousWeek: number[] = [];
    const valuesForCurrentFourWeeks: number[] = [];
    const valuesForPreviousFourWeeks: number[] = [];

    for (const chat of chats) {
      const currentWeekValues = await this.chatService.getCountDayPatientReturnByPeriod(
        chat.shortKey,
        EPeriod.CURRENT,
        EPeriodOfTime.WEEK,
      );
      const previousWeekValues = await this.chatService.getCountDayPatientReturnByPeriod(
        chat.shortKey,
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
      );
      const currentFourWeeksValues = await this.chatService.getCountDayPatientReturnByPeriod(
        chat.shortKey,
        EPeriod.CURRENT,
        EPeriodOfTime.FOUR_WEEKS,
      );
      const previousFourWeeksValues = await this.chatService.getCountDayPatientReturnByPeriod(
        chat.shortKey,
        EPeriod.PREVIOUS,
        EPeriodOfTime.FOUR_WEEKS,
      );

      const data = await this.getPlannedCheckin(chat.shortKey)
        .sort({
          createdAt: 1,
        })
        .exec();

      const plannedCheckins = data?.plannedCheckins || [];

      valuesForCurrentWeek.push(
        calcPatientReturn(
          currentWeekValues,
          plannedCheckins,
          EPeriod.CURRENT,
          EPeriodOfTime.WEEK,
        ),
      );
      valuesForPreviousWeek.push(
        calcPatientReturn(
          previousWeekValues,
          plannedCheckins,
          EPeriod.PREVIOUS,
          EPeriodOfTime.WEEK,
        ),
      );
      valuesForCurrentFourWeeks.push(
        calcPatientReturn(
          currentFourWeeksValues,
          plannedCheckins,
          EPeriod.CURRENT,
          EPeriodOfTime.FOUR_WEEKS,
        ),
      );
      valuesForPreviousFourWeeks.push(
        calcPatientReturn(
          previousFourWeeksValues,
          plannedCheckins,
          EPeriod.PREVIOUS,
          EPeriodOfTime.FOUR_WEEKS,
        ),
      );
    }
    return countPatientReturnByOperator(
      valuesForCurrentWeek,
      valuesForPreviousWeek,
      valuesForCurrentFourWeeks,
      valuesForPreviousFourWeeks,
      _id,
      name,
      minNorm,
    );
  }

  async getPatientReturnByCoachChats(chats: ChatDocument[]) {
    if (!chats.length) {
      throw new NotFoundException(CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR);
    }

    const trackedParameter = await this.findTrackedParameter(
      EAllowedTrackedParameters.PATIENT_RETURN,
    );

    if (!trackedParameter) {
      throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
    }

    const minNorm = trackedParameter.value;

    const patientReturnByChats = [];

    for (const chat of chats) {
      const currentWeekValues = await this.chatService.getCountDayPatientReturnByPeriod(
        chat.shortKey,
        EPeriod.CURRENT,
        EPeriodOfTime.WEEK,
      );
      const previousWeekValues = await this.chatService.getCountDayPatientReturnByPeriod(
        chat.shortKey,
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
      );
      const currentFourWeeksValues = await this.chatService.getCountDayPatientReturnByPeriod(
        chat.shortKey,
        EPeriod.CURRENT,
        EPeriodOfTime.FOUR_WEEKS,
      );
      const previousFourWeeksValues = await this.chatService.getCountDayPatientReturnByPeriod(
        chat.shortKey,
        EPeriod.PREVIOUS,
        EPeriodOfTime.FOUR_WEEKS,
      );

      const data = await this.getPlannedCheckin(chat.shortKey)
        .sort({
          createdAt: 1,
        })
        .exec();

      const plannedCheckins = data?.plannedCheckins || [];

      patientReturnByChats.push({
        name: chat.dummyName,
        shortKey: chat.shortKey,
        statistics: trackingParameterBlockTemplate(
          calcPatientReturn(
            currentWeekValues,
            plannedCheckins,
            EPeriod.CURRENT,
            EPeriodOfTime.WEEK,
          ),
          calcPatientReturn(
            previousWeekValues,
            plannedCheckins,
            EPeriod.PREVIOUS,
            EPeriodOfTime.WEEK,
          ),
          calcPatientReturn(
            currentFourWeeksValues,
            plannedCheckins,
            EPeriod.CURRENT,
            EPeriodOfTime.FOUR_WEEKS,
          ),
          calcPatientReturn(
            previousFourWeeksValues,
            plannedCheckins,
            EPeriod.PREVIOUS,
            EPeriodOfTime.FOUR_WEEKS,
          ),
          minNorm,
          ENormGuides.MIN_NORM,
          true,
        ),
      });
    }

    return {
      chats: patientReturnByChats,
    };
  }

  deleteDataTrackedParameters(chatId) {
    return this.dataTrackedParametersModel.deleteOne({ chatId }).exec();
  }
}
