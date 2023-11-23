import { Injectable, NotFoundException } from '@nestjs/common';
import { OperatorService } from '../operator/operator.service';
import { StatsService } from '../stats/stats.service';
import { EPeriod, EPeriodOfTime } from '../../utils/common';
import { ChatDocument } from '../operator/models/chat.model';
import {
  drugsOperatorDashboard,
  habitsOperatorDashboard,
  recommendationsOperatorDashboard,
} from './helpers';
import { TOperatorDashboardTemplateWithMultipleValues } from './helpers/types';
import { CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR } from '../trackedParameters/constants';

@Injectable()
export class DashboardService {
  constructor(
    private readonly operatorService: OperatorService,
    private readonly statsService: StatsService,
  ) {}

  getHabitsByClientNumber(
    habits: ChatDocument['habits'],
    clientNumber: string,
  ) {
    return habits.map(async (habit) => {
      const habitsDataForCurrentWeek = await this.statsService.getHabitsByHabitIdByClientByPeriod(
        clientNumber,
        habit.id,
        EPeriod.CURRENT,
        EPeriodOfTime.WEEK,
      );

      const habitsDataForPreviousWeek = await this.statsService.getHabitsByHabitIdByClientByPeriod(
        clientNumber,
        habit.id,
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
      );

      const habitsDataForCurrentMonth = await this.statsService.getHabitsByHabitIdByClientByPeriod(
        clientNumber,
        habit.id,
        EPeriod.CURRENT,
        EPeriodOfTime.MONTH,
      );

      const habitsDataForPreviousMonth = await this.statsService.getHabitsByHabitIdByClientByPeriod(
        clientNumber,
        habit.id,
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
      );

      return {
        currentHabit: habit,
        habitsDataForCurrentWeek,
        habitsDataForPreviousWeek,
        habitsDataForCurrentMonth,
        habitsDataForPreviousMonth,
      };
    });
  }

  async getHabitsForOperatorDashboard(operatorId: string) {
    const habitsDashboards: TOperatorDashboardTemplateWithMultipleValues[] = [];

    const chats = await this.operatorService.findAllActiveChatsById(operatorId);

    if (!chats.length) {
      throw new NotFoundException(CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR);
    }

    for (const chat of chats) {
      if (chat.habits.length) {
        const habitsRequests = await this.getHabitsByClientNumber(
          chat.habits,
          chat.clientNumber,
        );

        const habitsDashboard = await habitsOperatorDashboard(habitsRequests);

        const index = habitsDashboards.findIndex(
          (dashboard) => dashboard.chatName === chat.dummyName,
        );

        index >= 0
          ? habitsDashboards[index].data.push(...habitsDashboard)
          : habitsDashboards.push({
              chatName: chat.dummyName,
              data: [...habitsDashboard],
            });
      }
    }
    return habitsDashboards;
  }

  getRecommendationsByClientNumber(
    recommendations: ChatDocument['recommendations'],
    clientNumber: string,
  ) {
    return recommendations.map(async (recommendation) => {
      const recommendationsDataForCurrentWeek = await this.statsService.getRecommendationsByIdByClientByPeriod(
        clientNumber,
        recommendation.id,
        EPeriod.CURRENT,
        EPeriodOfTime.WEEK,
      );

      const recommendationsDataForPreviousWeek = await this.statsService.getRecommendationsByIdByClientByPeriod(
        clientNumber,
        recommendation.id,
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
      );

      const recommendationsDataForCurrentMonth = await this.statsService.getRecommendationsByIdByClientByPeriod(
        clientNumber,
        recommendation.id,
        EPeriod.CURRENT,
        EPeriodOfTime.MONTH,
      );

      const recommendationsDataForPreviousMonth = await this.statsService.getRecommendationsByIdByClientByPeriod(
        clientNumber,
        recommendation.id,
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
      );

      return {
        currentRecommendation: recommendation,
        recommendationsDataForCurrentWeek,
        recommendationsDataForPreviousWeek,
        recommendationsDataForCurrentMonth,
        recommendationsDataForPreviousMonth,
      };
    });
  }

  async getRecommendationsForOperatorDashboard(operatorId: string) {
    const recommendationsDashboards: TOperatorDashboardTemplateWithMultipleValues[] = [];

    const chats = await this.operatorService.findAllActiveChatsById(operatorId);

    if (!chats.length) {
      throw new NotFoundException(CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR);
    }

    for (const chat of chats) {
      if (chat.recommendations.length) {
        const recommendationsRequests = await this.getRecommendationsByClientNumber(
          chat.recommendations,
          chat.clientNumber,
        );

        const recommendationsDashboard = await recommendationsOperatorDashboard(
          recommendationsRequests,
        );

        const index = recommendationsDashboards.findIndex(
          (dashboard) => dashboard.chatName === chat.dummyName,
        );

        index >= 0
          ? recommendationsDashboards[index].data.push(
              ...recommendationsDashboard,
            )
          : recommendationsDashboards.push({
              chatName: chat.dummyName,
              data: [...recommendationsDashboard],
            });
      }
    }
    return recommendationsDashboards;
  }

  getDrugsByClientNumber(drugs: ChatDocument['drugs'], clientNumber: string) {
    return drugs.map(async (drug) => {
      const drugsDataForCurrentWeek = await this.statsService.getDrugsByDrugIdByClientByPeriod(
        clientNumber,
        drug.id,
        EPeriod.CURRENT,
        EPeriodOfTime.WEEK,
      );

      const drugsDataForPreviousWeek = await this.statsService.getDrugsByDrugIdByClientByPeriod(
        clientNumber,
        drug.id,
        EPeriod.PREVIOUS,
        EPeriodOfTime.WEEK,
      );

      const drugsDataForCurrentMonth = await this.statsService.getDrugsByDrugIdByClientByPeriod(
        clientNumber,
        drug.id,
        EPeriod.CURRENT,
        EPeriodOfTime.MONTH,
      );

      const drugsDataForPreviousMonth = await this.statsService.getDrugsByDrugIdByClientByPeriod(
        clientNumber,
        drug.id,
        EPeriod.PREVIOUS,
        EPeriodOfTime.MONTH,
      );

      return {
        currentDrug: drug,
        drugsDataForCurrentWeek,
        drugsDataForPreviousWeek,
        drugsDataForCurrentMonth,
        drugsDataForPreviousMonth,
      };
    });
  }

  async getDrugsForOperatorDashboard(operatorId: string) {
    const drugsDashboards: TOperatorDashboardTemplateWithMultipleValues[] = [];

    const chats = await this.operatorService.findAllActiveChatsById(operatorId);

    if (!chats.length) {
      throw new NotFoundException(CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR);
    }

    for (const chat of chats) {
      if (chat.drugs.length) {
        const drugsRequests = await this.getDrugsByClientNumber(
          chat.drugs,
          chat.clientNumber,
        );

        const drugsDashboard = await drugsOperatorDashboard(drugsRequests);

        const index = drugsDashboards.findIndex(
          (dashboard) => dashboard.chatName === chat.dummyName,
        );

        index >= 0
          ? drugsDashboards[index].data.push(...drugsDashboard)
          : drugsDashboards.push({
              chatName: chat.dummyName,
              data: [...drugsDashboard],
            });
      }
    }
    return drugsDashboards;
  }
}
