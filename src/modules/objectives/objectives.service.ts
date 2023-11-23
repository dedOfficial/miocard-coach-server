import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import omit = require('lodash/omit');
import groupBy = require('lodash/groupBy');

import {
  CreateObjectiveDto,
  DeleteObjectiveDto,
  GetObjectiveDto,
  ObjectiveKeyResultDto,
  UpdateObjectiveDto,
} from './dto/objectives.dto';
import { Objectives, ObjectivesDocument } from './models/objectives.model';
import { OperatorService } from 'modules/operator/operator.service';
import {
  EAllowedObjectiveKeyResultTrackingParameters,
  ETypeofOperatorId,
  TYPE_OF_OPERATOR_ID,
  OBJECTIVES_KEY_RESULTS_STAT,
  OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER,
} from './constants';
import { OperatorForChat } from 'modules/operator/enums/operators-for-chat.enum';
import { StatsService } from 'modules/stats/stats.service';
import { EPeriod, EPeriodOfTime } from 'utils/common';
import {
  combineTemplatesByAssistantByWeekAndMonth,
  combineTemplatesByOperatorByMonth,
  combineTemplatesByOperatorByWeekAndMonth,
  combineTemplatesCardioByOperatorByWeekAndMonth,
  combineTemplatesByOperatorOrAssistantByWeekAndMonth,
  getCheckinProblemsTemplateValue,
  getMeasurementTemplateValue,
  countUniqueAmountValuesForPeriod,
  getObjectiveKeyResultTemplate,
  getOperatorOrAssistantData,
  getPatientSelfEfficacyTemplateValue,
  getRecommendationsToFollowTemplateValue,
  getRepeatabilityOfHabitsTemplateValue,
  getSystolicAndDiastolicFromCardio,
  getValueDifferenceByAverageValue,
  getPatientReturnTemplateValue,
} from './helpers';
import { ECardio } from 'utils/stats';
import { ChatDocument } from 'modules/operator/models/chat.model';
import { TrackedParametersService } from 'modules/trackedParameters/trackedParameters.service';
import { ChatService } from 'modules/chat/chat.service';

@Injectable()
export class ObjectivesService {
  constructor(
    @InjectModel(Objectives.name)
    private objectivesModel: Model<ObjectivesDocument>,
    private readonly operatorService: OperatorService,
    private readonly statsService: StatsService,
    private readonly trackedParametersService: TrackedParametersService,
    private readonly chatService: ChatService,
  ) {}

  getObjectives() {
    return this.objectivesModel.find().select('_id name').lean();
  }

  createObjective(objective: CreateObjectiveDto) {
    // if Tracking Parameter PATIENT_RETURN or DATA_COLLECTION, we should explicitly
    // replace percentage to true, because logic of counting data should be as percentage: true
    // FrontEnd for this Tracking Parameter send to as false, because in UI we write Absolute values
    const keyResultsWithFixedTrackingParameter = objective.keyResults.map(
      (keyResult) => {
        if (
          keyResult.trackingParameter ===
            EAllowedObjectiveKeyResultTrackingParameters.PATIENT_RETURN ||
          keyResult.trackingParameter ===
            EAllowedObjectiveKeyResultTrackingParameters.DATA_COLLECTION
        ) {
          return {
            ...keyResult,
            firstNormValue: {
              ...keyResult.firstNormValue,
              percentage: true,
            },
          };
        }

        return keyResult;
      },
    );

    const fixedObjective: CreateObjectiveDto = {
      ...objective,
      keyResults: keyResultsWithFixedTrackingParameter,
    };

    return new this.objectivesModel(fixedObjective).save();
  }

  updateObjective(newObjective: UpdateObjectiveDto) {
    return this.objectivesModel.findByIdAndUpdate(
      newObjective.id,
      omit(newObjective, 'id'),
      { new: true, useFindAndModify: false },
    );
  }

  deleteObjective({ id: _id }: DeleteObjectiveDto) {
    return this.objectivesModel.deleteOne({ _id }).exec();
  }

  getObjective({ objectiveId }: GetObjectiveDto) {
    return this.objectivesModel
      .findById(objectiveId)
      .select('_id keyResults name')
      .lean();
  }

  // this function return result for one key result in one objective
  async getKeyResultValue(keyResult: ObjectiveKeyResultDto) {
    const { trackingParameter, firstNormValue, secondNormValue } = keyResult;

    // Blood pressure
    //
    // we count our data in another way if we have Cardio stat, because we have two values (systolic and diastolic)
    if (
      trackingParameter ===
      EAllowedObjectiveKeyResultTrackingParameters.BLOOD_PRESSURE
    ) {
      const chats = await this.operatorService.getAllActiveChatsByOperatorOrAssistant(
        OperatorForChat.COACH,
      );

      if (!chats.length) {
        throw new Error('Chats not found');
      }

      const operatorsById = await this.operatorService.findAllOperatorsAndReturnById();

      const returnDataRequest = chats.map(
        async ({ clientNumber, operatorId, _id }) => {
          const cardioForCurrentWeek = await this.statsService.findCardioStatByClientNumberByChatIdAndDate(
            clientNumber,
            EPeriodOfTime.WEEK,
            EPeriod.CURRENT,
            _id,
          );

          const cardioForPreviousWeek = await this.statsService.findCardioStatByClientNumberByChatIdAndDate(
            clientNumber,
            EPeriodOfTime.WEEK,
            EPeriod.PREVIOUS,
            _id,
          );

          const cardioForCurrentMonth = await this.statsService.findCardioStatByClientNumberByChatIdAndDate(
            clientNumber,
            EPeriodOfTime.MONTH,
            EPeriod.CURRENT,
            _id,
          );

          const cardioForPreviousMonth = await this.statsService.findCardioStatByClientNumberByChatIdAndDate(
            clientNumber,
            EPeriodOfTime.MONTH,
            EPeriod.PREVIOUS,
            _id,
          );

          const {
            systolic: systolicForWeek,
            diastolic: diastolicForWeek,
          } = getSystolicAndDiastolicFromCardio({
            currentPeriodList: cardioForCurrentWeek,
            previousPeriodList: cardioForPreviousWeek,
            systolicNormValue: firstNormValue,
            diastolicNormValue: secondNormValue,
          });

          const resultForWeek = [
            getObjectiveKeyResultTemplate(
              ECardio.SYSTOLIC,
              systolicForWeek,
              firstNormValue,
              false,
            ),
            getObjectiveKeyResultTemplate(
              ECardio.DIASTOLIC,
              diastolicForWeek,
              secondNormValue,
              false,
            ),
          ];

          const {
            systolic: systolicForMonth,
            diastolic: diastolicForMonth,
          } = getSystolicAndDiastolicFromCardio({
            currentPeriodList: cardioForCurrentMonth,
            previousPeriodList: cardioForPreviousMonth,
            systolicNormValue: firstNormValue,
            diastolicNormValue: secondNormValue,
          });

          const resultForMonth = [
            getObjectiveKeyResultTemplate(
              ECardio.SYSTOLIC,
              systolicForMonth,
              firstNormValue,
              true,
            ),
            getObjectiveKeyResultTemplate(
              ECardio.DIASTOLIC,
              diastolicForMonth,
              secondNormValue,
              true,
            ),
          ];

          const resultForCurrentChat = {
            operatorId,
            [EPeriodOfTime.WEEK]: resultForWeek,
            [EPeriodOfTime.MONTH]: resultForMonth,
          };

          return resultForCurrentChat;
        },
      );

      return Promise.all(returnDataRequest)
        .then((returnData) => {
          const groupedResultByOperatorId = groupBy(
            returnData,
            ETypeofOperatorId['OPERATOR_ID'],
          );

          return {
            type: EAllowedObjectiveKeyResultTrackingParameters.BLOOD_PRESSURE,
            data: combineTemplatesCardioByOperatorByWeekAndMonth({
              groupedResultByOperatorId,
              operatorsById,
            }),
          };
        })
        .catch(() => {
          throw new NotFoundException(
            'Something went wrong while counting Blood pressure Objective',
          );
        });
    }

    // Body weight
    //
    if (
      trackingParameter ===
      EAllowedObjectiveKeyResultTrackingParameters.BODY_WEIGHT
    ) {
      const chats = await this.operatorService.getAllActiveChats();

      if (!chats.length) {
        throw new Error('Chats not found');
      }

      const returnDataRequest = chats.map(
        async ({ _id, dummyName, clientNumber }) => {
          const statValuesForCurrentWeek = await this.statsService.findStatByClientNumberAndDate(
            clientNumber,
            EPeriodOfTime.WEEK,
            EPeriod.CURRENT,
            OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          );

          const statValuesForPreviousWeek = await this.statsService.findStatByClientNumberAndDate(
            clientNumber,
            EPeriodOfTime.WEEK,
            EPeriod.PREVIOUS,
            OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          );

          const statValuesForCurrentMonth = await this.statsService.findStatByClientNumberAndDate(
            clientNumber,
            EPeriodOfTime.MONTH,
            EPeriod.CURRENT,
            OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          );

          const statValuesForPreviousMonth = await this.statsService.findStatByClientNumberAndDate(
            clientNumber,
            EPeriodOfTime.MONTH,
            EPeriod.PREVIOUS,
            OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          );

          const valueForWeek = getValueDifferenceByAverageValue({
            firstNormValue,
            currentPeriodList: statValuesForCurrentWeek,
            previousPeriodList: statValuesForPreviousWeek,
            statDBKeyName: OBJECTIVES_KEY_RESULTS_STAT[trackingParameter],
          });

          const valueForMonth = getValueDifferenceByAverageValue({
            firstNormValue,
            currentPeriodList: statValuesForCurrentMonth,
            previousPeriodList: statValuesForPreviousMonth,
            statDBKeyName: OBJECTIVES_KEY_RESULTS_STAT[trackingParameter],
          });

          const resultForWeek = [
            getObjectiveKeyResultTemplate(
              OBJECTIVES_KEY_RESULTS_STAT[trackingParameter],
              valueForWeek,
              firstNormValue,
              false,
            ),
          ];

          const resultForMonth = [
            getObjectiveKeyResultTemplate(
              OBJECTIVES_KEY_RESULTS_STAT[trackingParameter],
              valueForMonth,
              firstNormValue,
              true,
            ),
          ];

          const resultForCurrentChat = {
            _id,
            name: dummyName,
            [EPeriodOfTime.WEEK]: resultForWeek,
            [EPeriodOfTime.MONTH]: resultForMonth,
          };

          return resultForCurrentChat;
        },
      );

      return Promise.all(returnDataRequest)
        .then((returnData) => {
          return {
            type: EAllowedObjectiveKeyResultTrackingParameters.BODY_WEIGHT,
            data: returnData,
          };
        })
        .catch(() => {
          throw new NotFoundException(
            'Something went wrong while counting Body weight Objective',
          );
        });
    }

    // Patient self-efficacy
    //
    if (
      trackingParameter ===
      EAllowedObjectiveKeyResultTrackingParameters['PATIENT_SELF-EFFICACY']
    ) {
      const chats = await this.operatorService.getAllActiveChatsByOperatorOrAssistant(
        OperatorForChat.COACH,
      );

      if (!chats.length) {
        throw new Error('Chats not found');
      }

      const operatorsById = await this.operatorService.findAllOperatorsAndReturnById();

      const resultByChats = chats.map((chat: ChatDocument) =>
        getPatientSelfEfficacyTemplateValue({
          chat,
          firstNormValue,
        }),
      );

      const groupedResultByOperatorId = groupBy(
        resultByChats,
        ETypeofOperatorId['OPERATOR_ID'],
      );

      return {
        type:
          EAllowedObjectiveKeyResultTrackingParameters['PATIENT_SELF-EFFICACY'],
        data: combineTemplatesByOperatorByMonth({
          groupedResultByOperatorId,
          operatorsById,
        }),
      };
    }

    // Measurements frequency
    //
    if (
      trackingParameter ===
      EAllowedObjectiveKeyResultTrackingParameters['BP_MEASUREMENTS_FREQUENCY']
    ) {
      const chats = await this.operatorService.getAllActiveChatsByOperatorOrAssistant(
        OperatorForChat.ASSISTANT,
      );

      if (!chats.length) {
        throw new Error('Chats not found');
      }

      const assistantsById = await this.operatorService.findAllOperatorsAndReturnById();

      const resultMeasurementByChatsRequest = chats.map(async (chat) => {
        const { clientNumber, _id } = chat;

        const statValuesForCurrentWeek = await this.statsService.getAmountOfUniqueStatsByChatPerDay(
          clientNumber,
          EPeriodOfTime.WEEK,
          EPeriod.CURRENT,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER['Blood pressure'],
          _id,
        );

        const statValuesForPreviousWeek =
          firstNormValue.percentage &&
          (await this.statsService.getAmountOfUniqueStatsByChatPerDay(
            clientNumber,
            EPeriodOfTime.WEEK,
            EPeriod.PREVIOUS,
            OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER['Blood pressure'],
            _id,
          ));

        const statValuesForCurrentMonth = await this.statsService.getAmountOfUniqueStatsByChatPerDay(
          clientNumber,
          EPeriodOfTime.MONTH,
          EPeriod.CURRENT,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER['Blood pressure'],
          _id,
        );

        // TODO describe it
        const statValuesForPreviousMonth =
          firstNormValue.percentage &&
          (await this.statsService.getAmountOfUniqueStatsByChatPerDay(
            clientNumber,
            EPeriodOfTime.MONTH,
            EPeriod.PREVIOUS,
            OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER['Blood pressure'],
            _id,
          ));

        const valueForWeek = countUniqueAmountValuesForPeriod({
          firstNormValue,
          currentPeriodValue: statValuesForCurrentWeek,
          previousPeriodValue: statValuesForPreviousWeek,
        });

        const valueForMonth = countUniqueAmountValuesForPeriod({
          firstNormValue,
          currentPeriodValue: statValuesForCurrentMonth,
          previousPeriodValue: statValuesForPreviousMonth,
        });

        return getMeasurementTemplateValue({
          chat,
          firstNormValue,
          valueForWeek,
          valueForMonth,
        });
      });

      return Promise.all(resultMeasurementByChatsRequest)
        .then((returnData) => {
          const groupedResultByAssistantId = groupBy(
            returnData,
            ETypeofOperatorId['ASSISTANT_ID'],
          );

          return {
            type:
              EAllowedObjectiveKeyResultTrackingParameters.BP_MEASUREMENTS_FREQUENCY,
            data: combineTemplatesByAssistantByWeekAndMonth({
              groupedResultByAssistantId,
              assistantsById,
            }),
          };
        })
        .catch(() => {
          throw new NotFoundException(
            'Something went wrong while counting Measurements frequency Objective',
          );
        });
    }

    // Repeatability of the habits
    //
    if (
      trackingParameter ===
      EAllowedObjectiveKeyResultTrackingParameters[
        'REPEATABILITY_OF_THE_HABITS'
      ]
    ) {
      const chats = await this.operatorService.getAllActiveChatsByOperatorOrAssistant(
        OperatorForChat.COACH,
      );

      if (!chats.length) {
        throw new Error('Chats not found');
      }

      const operatorsById = await this.operatorService.findAllOperatorsAndReturnById();

      const returnDataRequest = chats.map(async (chat) => {
        const { clientNumber, operatorId, _id } = chat;

        const statValuesForCurrentWeek = await this.statsService.findStatByClientNumberByChatIdAndDate(
          clientNumber,
          EPeriodOfTime.WEEK,
          EPeriod.CURRENT,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          _id,
        );

        const statValuesForPreviousWeek = await this.statsService.findStatByClientNumberByChatIdAndDate(
          clientNumber,
          EPeriodOfTime.WEEK,
          EPeriod.PREVIOUS,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          _id,
        );

        const statValuesForCurrentMonth = await this.statsService.findStatByClientNumberByChatIdAndDate(
          clientNumber,
          EPeriodOfTime.MONTH,
          EPeriod.CURRENT,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          _id,
        );

        const statValuesForPreviousMonth = await this.statsService.findStatByClientNumberByChatIdAndDate(
          clientNumber,
          EPeriodOfTime.MONTH,
          EPeriod.PREVIOUS,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          _id,
        );

        const valueForWeek = getValueDifferenceByAverageValue({
          firstNormValue,
          currentPeriodList: statValuesForCurrentWeek,
          previousPeriodList: statValuesForPreviousWeek,
          statDBKeyName: OBJECTIVES_KEY_RESULTS_STAT[trackingParameter],
        });

        const valueForMonth = getValueDifferenceByAverageValue({
          firstNormValue,
          currentPeriodList: statValuesForCurrentMonth,
          previousPeriodList: statValuesForPreviousMonth,
          statDBKeyName: OBJECTIVES_KEY_RESULTS_STAT[trackingParameter],
        });

        return getRepeatabilityOfHabitsTemplateValue({
          operatorId,
          firstNormValue,
          valueForWeek,
          valueForMonth,
        });
      });

      return Promise.all(returnDataRequest)
        .then((returnData) => {
          const groupedResultByOperatorId = groupBy(
            returnData,
            ETypeofOperatorId['OPERATOR_ID'],
          );

          return {
            type:
              EAllowedObjectiveKeyResultTrackingParameters.REPEATABILITY_OF_THE_HABITS,
            data: combineTemplatesByOperatorByWeekAndMonth({
              groupedResultByOperatorId,
              operatorsById,
            }),
          };
        })
        .catch(() => {
          throw new NotFoundException(
            'Something went wrong while counting Repeatability of the habits Objective',
          );
        });
    }

    // Check-in problems
    //
    if (
      trackingParameter ===
      EAllowedObjectiveKeyResultTrackingParameters['CHECK-IN_PROBLEMS']
    ) {
      const groupedChatsByCoachAndAssistant = await this.operatorService.getAllActiveChatsGroupByOperatorAndAssistant();

      if (!groupedChatsByCoachAndAssistant.length) {
        throw new Error('Chats not found');
      }

      const operatorsAndAssistantsById = await this.operatorService.findAllOperatorsAndReturnById();

      const getStatValuesByOperator = (
        typeOfOperator: OperatorForChat,
        chatsByOperator,
      ) =>
        chatsByOperator.map(
          async ({ _id, clientNumber, operatorId, assistantId }) => {
            const statValuesForCurrentWeek = await this.statsService.getAmountOfCheckinsByClientNumberByChatIdByCheckinCheckboxesWithoutProblems(
              clientNumber,
              EPeriod.CURRENT,
              EPeriodOfTime.WEEK,
              _id,
            );

            const statValuesForCurrentMonth = await this.statsService.getAmountOfCheckinsByClientNumberByChatIdByCheckinCheckboxesWithoutProblems(
              clientNumber,
              EPeriod.CURRENT,
              EPeriodOfTime.MONTH,
              _id,
            );

            const {
              operatorOrAssistantId,
              operatorTypeId,
            } = getOperatorOrAssistantData({ operatorId, assistantId })[
              typeOfOperator
            ];

            return getCheckinProblemsTemplateValue({
              operatorOrAssistantId,
              operatorTypeId,
              firstNormValue,
              statValuesForCurrentWeek,
              statValuesForCurrentMonth,
            });
          },
        );

      const returnDataRequest = groupedChatsByCoachAndAssistant.map(
        ({ _id: typeOfOperator, chats: chatsByOperator }) =>
          Promise.all(
            getStatValuesByOperator(typeOfOperator, chatsByOperator),
          ).then((data) => ({
            type: typeOfOperator,
            data,
          })),
      );

      return Promise.all(returnDataRequest)
        .then((returnData) => {
          const data = returnData.map(({ type, data }) => {
            const typeOperatorId = TYPE_OF_OPERATOR_ID[type];

            const groupedResultByOperatorId = groupBy(data, typeOperatorId);

            return combineTemplatesByOperatorOrAssistantByWeekAndMonth({
              groupedResultByOperatorId,
              operatorsById: operatorsAndAssistantsById,
              operatorOrAssistantId: typeOperatorId,
            });
          });

          return {
            type:
              EAllowedObjectiveKeyResultTrackingParameters['CHECK-IN_PROBLEMS'],
            data,
          };
        })
        .catch(() => {
          throw new NotFoundException(
            'Something went wrong while counting Check-in problems Objective',
          );
        });
    }

    // Recommendations to follow
    //
    if (trackingParameter === 'Recommendations to follow') {
      const chats = await this.operatorService.getAllActiveChats();

      if (!chats.length) {
        throw new Error('Chats not found');
      }

      const operatorsById = await this.operatorService.findAllOperatorsAndReturnById();

      const returnDataRequest = chats.map(async (chat) => {
        const { clientNumber, operatorId, _id } = chat;

        const statValuesForCurrentWeek = await this.statsService.findStatByClientNumberByChatIdAndDate(
          clientNumber,
          EPeriodOfTime.WEEK,
          EPeriod.CURRENT,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          _id,
        );

        const statValuesForPreviousWeek = await this.statsService.findStatByClientNumberByChatIdAndDate(
          clientNumber,
          EPeriodOfTime.WEEK,
          EPeriod.PREVIOUS,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          _id,
        );

        const statValuesForCurrentMonth = await this.statsService.findStatByClientNumberByChatIdAndDate(
          clientNumber,
          EPeriodOfTime.MONTH,
          EPeriod.CURRENT,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          _id,
        );

        const statValuesForPreviousMonth = await this.statsService.findStatByClientNumberByChatIdAndDate(
          clientNumber,
          EPeriodOfTime.MONTH,
          EPeriod.PREVIOUS,
          OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER[trackingParameter],
          _id,
        );

        const valueForWeek = getValueDifferenceByAverageValue({
          firstNormValue,
          currentPeriodList: statValuesForCurrentWeek,
          previousPeriodList: statValuesForPreviousWeek,
          statDBKeyName: OBJECTIVES_KEY_RESULTS_STAT[trackingParameter],
        });

        const valueForMonth = getValueDifferenceByAverageValue({
          firstNormValue,
          currentPeriodList: statValuesForCurrentMonth,
          previousPeriodList: statValuesForPreviousMonth,
          statDBKeyName: OBJECTIVES_KEY_RESULTS_STAT[trackingParameter],
        });

        return getRecommendationsToFollowTemplateValue({
          operatorId,
          firstNormValue,
          valueForWeek,
          valueForMonth,
        });
      });

      return Promise.all(returnDataRequest)
        .then((returnData) => {
          const groupedResultByOperatorId = groupBy(
            returnData,
            ETypeofOperatorId['OPERATOR_ID'],
          );

          return {
            type:
              EAllowedObjectiveKeyResultTrackingParameters.RECOMMENDATIONS_TO_FOLLOW,
            data: combineTemplatesByOperatorByWeekAndMonth({
              groupedResultByOperatorId,
              operatorsById,
            }),
          };
        })
        .catch(() => {
          throw new NotFoundException(
            'Something went wrong while counting Recommendations to follow Objective',
          );
        });
    }

    // Patient return
    //
    if (
      trackingParameter ===
      EAllowedObjectiveKeyResultTrackingParameters['PATIENT_RETURN']
    ) {
      const groupedChatsByCoachAndAssistant = await this.operatorService.getAllActiveChatsGroupByOperatorAndAssistant();

      if (!groupedChatsByCoachAndAssistant.length) {
        throw new Error('Chats not found');
      }

      const operatorsAndAssistantsById = await this.operatorService.findAllOperatorsAndReturnById();

      const getStatValuesByOperator = (
        typeOfOperator: OperatorForChat,
        chatsByOperator,
      ) =>
        chatsByOperator.map(async (chat) => {
          const { operatorId, assistantId, shortKey } = chat;

          const valueForCurrentWeek = await this.chatService.getAmountOfUniqueDaysPatientReturnByPeriod(
            shortKey,
            EPeriod.CURRENT,
            EPeriodOfTime.WEEK,
          );

          const valueForPreviousWeek =
            firstNormValue.percentage &&
            (await this.chatService.getAmountOfUniqueDaysPatientReturnByPeriod(
              shortKey,
              EPeriod.PREVIOUS,
              EPeriodOfTime.WEEK,
            ));

          const valueForCurrentMonth = await this.chatService.getAmountOfUniqueDaysPatientReturnByPeriod(
            chat.shortKey,
            EPeriod.CURRENT,
            EPeriodOfTime.MONTH,
          );

          const valueForPreviousMonth =
            firstNormValue.percentage &&
            (await this.chatService.getAmountOfUniqueDaysPatientReturnByPeriod(
              chat.shortKey,
              EPeriod.PREVIOUS,
              EPeriodOfTime.MONTH,
            ));

          const valueForWeek = countUniqueAmountValuesForPeriod({
            firstNormValue,
            currentPeriodValue: valueForCurrentWeek,
            previousPeriodValue: valueForPreviousWeek,
          });

          const valueForMonth = countUniqueAmountValuesForPeriod({
            firstNormValue,
            currentPeriodValue: valueForCurrentMonth,
            previousPeriodValue: valueForPreviousMonth,
          });

          const {
            operatorOrAssistantId,
            operatorTypeId,
          } = getOperatorOrAssistantData({ operatorId, assistantId })[
            typeOfOperator
          ];

          return getPatientReturnTemplateValue({
            operatorOrAssistantId,
            operatorTypeId,
            firstNormValue,
            valueForWeek,
            valueForMonth,
          });
        });

      const returnDataRequest = groupedChatsByCoachAndAssistant.map(
        ({ _id: typeOfOperator, chats: chatsByOperator }) =>
          Promise.all(
            getStatValuesByOperator(typeOfOperator, chatsByOperator),
          ).then((data) => ({
            type: typeOfOperator,
            data,
          })),
      );

      return Promise.all(returnDataRequest)
        .then((returnData) => {
          const data = returnData.map(({ type, data }) => {
            const typeOperatorId = TYPE_OF_OPERATOR_ID[type];

            const groupedResultByOperatorId = groupBy(data, typeOperatorId);

            return combineTemplatesByOperatorOrAssistantByWeekAndMonth({
              groupedResultByOperatorId,
              operatorsById: operatorsAndAssistantsById,
              operatorOrAssistantId: typeOperatorId,
            });
          });

          return {
            type: EAllowedObjectiveKeyResultTrackingParameters.PATIENT_RETURN,
            data,
          };
        })
        .catch(() => {
          throw new NotFoundException(
            'Something went wrong while counting Patient return Objective',
          );
        });
    }

    // Data collection
    //
    if (trackingParameter === 'Data collection') {
      const chats = await this.operatorService.getAllActiveChats();

      if (!chats.length) {
        throw new Error('Chats not found');
      }

      return {
        type: EAllowedObjectiveKeyResultTrackingParameters.DATA_COLLECTION,
        data: [],
      };
    }
  }
  catch(error) {
    throw new NotFoundException(error.message);
  }
}
