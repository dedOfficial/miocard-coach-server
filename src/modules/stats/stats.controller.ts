import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import values = require('lodash/values');

import {
  EAllowedCheckinOptions,
  initialCardioDiseases,
  initialChronicDiseases,
  initialJobDescriptions,
  initialRelativeDiseases,
  STATS_OPTIONS,
} from './constants';

import { initial_statusesType } from 'types/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';
import { httpExceptionStatError, statWasNotFoundError } from 'utils/stats';
import {
  AddSymptomDto,
  DeleteSymptomDto,
  GetDistinctSymptomDto,
  GetSymptomDto,
  UpdateSymptomDto,
} from './dto/symptom.dto';
import {
  CreateCheckinDto,
  DeleteCheckinDto,
  GetCheckinDto,
  UpdateCheckinDto,
} from './dto/checkin.dto';
import {
  CreateHabitDto,
  DeleteHabitDto,
  GetDistinctHabitDto,
  GetHabitsDto,
  UpdateHabitDto,
} from './dto/habit.dto';
import { ChatService } from 'modules/chat/chat.service';
import {
  CreateWeightDto,
  DeleteWeightDto,
  GetDistinctWeightDto,
  GetWeightDto,
  UpdateWeightDto,
} from './dto/weight.dto';
import {
  CreateDrugDto,
  DeleteDrugDto,
  GetDistinctDrugDto,
  GetDrugDto,
  UpdateDrugDto,
} from './dto/drug.dto';
import {
  AddCardioDto,
  DeleteCardioDto,
  GetCardioDto,
  UpdateCardioDto,
} from './dto/cardio.dto';
import {
  CreateFoodDto,
  DeleteFoodDto,
  GetDistinctFoodDto,
  GetFoodDto,
  UpdateFoodDto,
} from './dto/food.dto';
import {
  CreateMoodDto,
  DeleteMoodDto,
  GetDistinctMoodDto,
  GetMoodDto,
  UpdateMoodDto,
} from './dto/mood.dto';
import {
  CreateRecommendationDto,
  DeleteRecommendationDto,
  GetDistinctRecommendationDto,
  GetRecommendationsDto,
  UpdateRecommendationDto,
} from './dto/recommendation.dto';
import {
  CreateNotesDto,
  DeleteNotesDto,
  GetDistinctNotesDto,
  GetNotesDto,
  UpdateNotesDto,
} from './dto/notes.dto';
import {
  CreateWalkedDistanceDto,
  DeleteWalkedDistanceDto,
  GetDistinctWalkedDistanceDto,
  GetWalkedDistanceDto,
  UpdateWalkedDistanceDto,
} from './dto/walked-distance.dto';
import { EStatName, EStatsModels, TStat } from '../../utils/stats/types';
import { KitsService } from 'modules/kits/kits.service';

@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly chatService: ChatService,
    private readonly kitsService: KitsService,
  ) {}

  @UseGuards(new JwtAuthGuard())
  @Get('types')
  getStatTypes() {
    return values(EAllowedCheckinOptions);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('all_options')
  getStatAllOptions() {
    return values(STATS_OPTIONS);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('initial_statuses')
  getStatuses(): initial_statusesType {
    const initial_statuses = {
      initialJobDescriptions,
      initialCardioDiseases,
      initialRelativeDiseases,
      initialChronicDiseases,
    };
    return initial_statuses;
  }

  @UseGuards(new JwtAuthGuard())
  @Get()
  async getCurrentStats(
    @Query('clientNumber') clientNumber: string,
    @Query('date') date: string,
  ) {
    const currentStats = {};
    const requests = Object.values(EStatsModels).map((model) =>
      this.statsService
        .getClientStatForCurrentDay(clientNumber.replace(/ /, '+'), model, date)
        .then((data) => ({ data, stat: EStatName[model] })),
    );
    await Promise.all(
      requests.map(
        (request) =>
          new Promise((resolve, reject) => {
            const value = request;
            value.then(({ data, stat }) =>
              data ? resolve(value) : reject(stat),
            );
          }),
      ),
    ).then(
      (values: Array<{ data: TStat[]; stat: string }>) =>
        values.map((value) => {
          currentStats[value.stat] = value.data;
        }),
      (reason) => {
        return statWasNotFoundError(reason);
      },
    );

    return currentStats;
  }

  // Cardio controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('cardio')
  async addCardio(@Body() addCardioDto: AddCardioDto) {
    const kit = await this.kitsService.getOneKit(addCardioDto.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      addCardioDto.clientNumber,
      EStatsModels.CARDIO_MODEL,
      addCardioDto.day,
      addCardioDto.checkin,
    );

    const newStat =
      addedStatsTodayLength === 0
        ? await this.statsService.createCardio(addCardioDto)
        : await this.statsService.createCardioWithoutKit(addCardioDto);

    if (!newStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength === 0 ? newStat : { stat: newStat };
  }

  @UseGuards(new JwtAuthGuard())
  @Get('cardio/:clientNumber')
  async getCardio(@Param() params: GetCardioDto) {
    return this.statsService.getCardio(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('cardio/distinct/:clientNumber')
  async distinctCardio(@Param() params: GetCardioDto) {
    return this.statsService.distinctCardioDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('cardio')
  @UsePipes(new ValidationPipe())
  async updateCardio(@Body() cardio: UpdateCardioDto) {
    const updatedCardio = await this.statsService.updateCardio(cardio);

    if (!updatedCardio) {
      return statWasNotFoundError('Cardio');
    }

    return this.statsService.updateCardio(cardio);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('cardio')
  async deleteCardio(@Body() deleteCardio: DeleteCardioDto) {
    const kit = await this.kitsService.getOneKit(deleteCardio.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      deleteCardio.clientNumber,
      EStatsModels.CARDIO_MODEL,
      deleteCardio.day,
      deleteCardio.checkin,
    );

    const deletedStat =
      addedStatsTodayLength > 1
        ? await this.statsService.deleteCardioWithoutKit(deleteCardio.id)
        : await this.statsService.deleteCardio(deleteCardio);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength > 1 ? { stat: deletedStat } : deletedStat;
  }

  // Checkin controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('checkin')
  @UsePipes(new ValidationPipe())
  async addCheckin(@Body() createCheckinDto: CreateCheckinDto) {
    const kit = await this.kitsService.getOneKit(createCheckinDto.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const newStat = await this.statsService.createCheckin(createCheckinDto);

    if (!newStat) {
      return httpExceptionStatError();
    }

    return newStat;
  }

  @UseGuards(new JwtAuthGuard())
  @Get('checkin/:clientNumber')
  @UsePipes(new ValidationPipe())
  getCheckin(@Param() params: GetCheckinDto) {
    return this.statsService.getCheckins(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('checkin/distinct/:clientNumber')
  @UsePipes(new ValidationPipe())
  distinctCheckin(@Param() params: GetCheckinDto) {
    return this.statsService.distinctCheckinDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('checkin')
  @UsePipes(new ValidationPipe())
  async updateCheckin(@Body() newCheckin: UpdateCheckinDto) {
    const updateCheckin = await this.statsService.updateCheckin(newCheckin);

    if (!updateCheckin) {
      throw new NotFoundException('Stat have not been updated');
    }

    return updateCheckin;
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('checkin')
  @UsePipes(new ValidationPipe())
  async deleteCheckin(@Body() deleteCheckinDto: DeleteCheckinDto) {
    const kit = await this.kitsService.getOneKit(deleteCheckinDto.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      deleteCheckinDto.clientNumber,
      EStatsModels.CHECKIN_MODEL,
      deleteCheckinDto.day,
      deleteCheckinDto.checkin,
    );

    const deletedStat =
      addedStatsTodayLength > 1
        ? await this.statsService.deleteCheckinWithoutKit(deleteCheckinDto.id)
        : await this.statsService.deleteCheckin(deleteCheckinDto);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength > 1 ? { stat: deletedStat } : deletedStat;
  }

  // Meals and Food controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('food')
  @UsePipes(new ValidationPipe())
  async addFood(@Body() createFoodDto: CreateFoodDto) {
    const kit = await this.kitsService.getOneKit(createFoodDto.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      createFoodDto.clientNumber,
      EStatsModels.FOOD_MODEL,
      createFoodDto.day,
      createFoodDto.checkin,
    );

    const newStat =
      addedStatsTodayLength === 0
        ? await this.statsService.createFood(createFoodDto)
        : await this.statsService.createFoodWithoutKit(createFoodDto);

    if (!newStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength === 0 ? newStat : { stat: newStat };
  }

  @UseGuards(new JwtAuthGuard())
  @Get('food/:clientNumber')
  async getFood(@Param() params: GetFoodDto) {
    return this.statsService.getFood(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('food/distinct/:clientNumber')
  async distinctFood(@Param() params: GetDistinctFoodDto) {
    return this.statsService.distinctFoodDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('food')
  async updateFood(@Body() newFood: UpdateFoodDto) {
    return this.statsService.updateFood(newFood);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('food')
  async deleteFood(@Body() deleteFoodDto: DeleteFoodDto) {
    const kit = await this.kitsService.getOneKit(deleteFoodDto.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      deleteFoodDto.clientNumber,
      EStatsModels.FOOD_MODEL,
      deleteFoodDto.day,
      deleteFoodDto.checkin,
    );

    const deletedStat =
      addedStatsTodayLength > 1
        ? await this.statsService.deleteFoodWithoutKit(deleteFoodDto.id)
        : await this.statsService.deleteFood(deleteFoodDto);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength > 1 ? { stat: deletedStat } : deletedStat;
  }

  // Habit controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('habit')
  async addHabit(@Body() newHabit: CreateHabitDto) {
    const chat = await this.chatService.findChatByClientNumber(
      newHabit.clientNumber,
    );
    const habit = chat.habits.find((habit) => habit.id === newHabit.habitId);

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const newStat = await this.statsService.createHabit(newHabit);

    if (!newStat) {
      return httpExceptionStatError();
    }

    return newStat;
  }

  @UseGuards(new JwtAuthGuard())
  @Get('habit/:clientNumber')
  getHabits(@Param() params: GetHabitsDto) {
    return this.statsService.getHabits(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('habit/distinct/:clientNumber')
  distinctHabit(@Param() params: GetDistinctHabitDto) {
    return this.statsService.distinctHabitDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('habit')
  async updateHabit(@Body() newHabit: UpdateHabitDto) {
    const updateHabit = await this.statsService.updateHabit(newHabit);

    if (!updateHabit) {
      throw new NotFoundException('Stat have not been updated');
    }

    return updateHabit;
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('habit')
  async deleteHabit(@Body() habit: DeleteHabitDto) {
    const deletedStat = await this.statsService.deleteHabit(habit);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return deletedStat;
  }

  // Recommendation controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('recommendation')
  async addRecommendation(@Body() newRecommendation: CreateRecommendationDto) {
    const chat = await this.chatService.findChatByClientNumber(
      newRecommendation.clientNumber,
    );
    const recommendation = chat.recommendations.find(
      (recommendation) =>
        recommendation.id === newRecommendation.recommendationId,
    );

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }

    const newStat = await this.statsService.createRecommendation(
      newRecommendation,
    );

    if (!newStat) {
      return httpExceptionStatError();
    }

    return newStat;
  }

  @UseGuards(new JwtAuthGuard())
  @Get('recommendation/:clientNumber')
  getRecommendations(@Param() params: GetRecommendationsDto) {
    return this.statsService.getRecommendations(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('recommendation/distinct/:clientNumber')
  distinctRecommendation(@Param() params: GetDistinctRecommendationDto) {
    return this.statsService.distinctRecommendationDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('recommendation')
  async updateRecommendation(
    @Body() newRecommendation: UpdateRecommendationDto,
  ) {
    const updateRecommendation = await this.statsService.updateRecommendation(
      newRecommendation,
    );

    if (!updateRecommendation) {
      throw new NotFoundException('Stat have not been updated');
    }

    return updateRecommendation;
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('recommendation')
  async deleteRecommendation(@Body() recommendation: DeleteRecommendationDto) {
    const deletedStat = await this.statsService.deleteRecommendation(
      recommendation,
    );

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return deletedStat;
  }

  // Drug controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('drug')
  async addDrug(@Body() newDrug: CreateDrugDto) {
    const chat = await this.chatService.findChatByClientNumber(
      newDrug.clientNumber,
    );
    const drug = chat.drugs.find((drug) => drug.id === newDrug.drugId);

    if (!drug) {
      throw new NotFoundException('Medication not found');
    }

    const newStat = await this.statsService.createDrug(newDrug);

    if (!newStat) {
      return httpExceptionStatError();
    }

    return newStat;
  }

  @UseGuards(new JwtAuthGuard())
  @Get('drug/:clientNumber')
  async getDrug(@Param() params: GetDrugDto) {
    return this.statsService.getDrug(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('drug/distinct/:clientNumber')
  async distinctDrug(@Param() params: GetDistinctDrugDto) {
    return this.statsService.distinctDrugDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('drug')
  async updateDrug(@Body() newDrug: UpdateDrugDto) {
    return this.statsService.updateDrug(newDrug);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('drug')
  async deleteDrug(@Body() deleteDrug: DeleteDrugDto) {
    const deletedStat = await this.statsService.deleteDrug(deleteDrug);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return deletedStat;
  }

  // Symptom controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('symptom')
  @UsePipes(new ValidationPipe())
  async addSymptom(@Body() newSymptom: AddSymptomDto) {
    const kit = await this.kitsService.getOneKit(newSymptom.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      newSymptom.clientNumber,
      EStatsModels.SYMPTOM_MODEL,
      newSymptom.day,
      newSymptom.checkin,
    );

    const newStat =
      addedStatsTodayLength === 0
        ? await this.statsService.createSymptom(newSymptom)
        : await this.statsService.createSymptomWithoutKit(newSymptom);

    if (!newStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength === 0 ? newStat : { stat: newStat };
  }

  @UseGuards(new JwtAuthGuard())
  @Get('symptom/:clientNumber')
  async getSymptom(@Param() params: GetSymptomDto) {
    return this.statsService.getSymptom(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('symptom/distinct/:clientNumber')
  async distinctSymptom(@Param() params: GetDistinctSymptomDto) {
    return this.statsService.distinctSymptomDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('symptom')
  async updateSymptom(@Body() newSymptom: UpdateSymptomDto) {
    return this.statsService.updateSymptom(newSymptom);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('symptom')
  async deleteSymptom(@Body() deleteSymptom: DeleteSymptomDto) {
    const kit = await this.kitsService.getOneKit(deleteSymptom.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      deleteSymptom.clientNumber,
      EStatsModels.SYMPTOM_MODEL,
      deleteSymptom.day,
      deleteSymptom.checkin,
    );

    const deletedStat =
      addedStatsTodayLength > 1
        ? await this.statsService.deleteSymptomWithoutKit(deleteSymptom.id)
        : await this.statsService.deleteSymptom(deleteSymptom);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength > 1 ? { stat: deletedStat } : deletedStat;
  }

  // WalkedDistance controllers
  @UseGuards(new JwtAuthGuard())
  @Post('walkedDistance')
  async addWalkedDistance(@Body() walkedDistance: CreateWalkedDistanceDto) {
    const kit = await this.kitsService.getOneKit(walkedDistance.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      walkedDistance.clientNumber,
      EStatsModels.WALKED_DISTANCE_MODEL,
      walkedDistance.day,
      walkedDistance.checkin,
    );

    const newStat =
      addedStatsTodayLength === 0
        ? await this.statsService.createWalkedDistance(walkedDistance)
        : await this.statsService.createWalkedDistanceWithoutKit(
            walkedDistance,
          );

    if (!newStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength === 0 ? newStat : { stat: newStat };
  }

  @UseGuards(new JwtAuthGuard())
  @Get('walkedDistance/:clientNumber')
  async getWalkedDistance(@Param() params: GetWalkedDistanceDto) {
    return this.statsService.getWalkedDistance(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('walkedDistance/distinct/:clientNumber')
  async distinctWalkedDistance(@Param() params: GetDistinctWalkedDistanceDto) {
    return this.statsService.distinctWalkedDistanceDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('walkedDistance')
  async updateWalkedDistance(
    @Body() newWalkedDistance: UpdateWalkedDistanceDto,
  ) {
    return this.statsService.updateWalkedDistance(newWalkedDistance);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('walkedDistance')
  async deleteWalkedDistance(
    @Body() deleteWalkedDistance: DeleteWalkedDistanceDto,
  ) {
    const kit = await this.kitsService.getOneKit(deleteWalkedDistance.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      deleteWalkedDistance.clientNumber,
      EStatsModels.WALKED_DISTANCE_MODEL,
      deleteWalkedDistance.day,
      deleteWalkedDistance.checkin,
    );

    const deletedStat =
      addedStatsTodayLength > 1
        ? await this.statsService.deleteWalkedDistanceWithoutKit(
            deleteWalkedDistance.id,
          )
        : await this.statsService.deleteWalkedDistance(deleteWalkedDistance);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength > 1 ? { stat: deletedStat } : deletedStat;
  }

  // Mood controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('mood')
  async addMood(@Body() mood: CreateMoodDto) {
    const kit = await this.kitsService.getOneKit(mood.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      mood.clientNumber,
      EStatsModels.MOOD_MODEL,
      mood.day,
      mood.checkin,
    );

    const newStat =
      addedStatsTodayLength === 0
        ? await this.statsService.createMood(mood)
        : await this.statsService.createMoodWithoutKit(mood);

    if (!newStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength === 0 ? newStat : { stat: newStat };
  }

  @UseGuards(new JwtAuthGuard())
  @Get('mood/:clientNumber')
  async getMood(@Param() params: GetMoodDto) {
    return this.statsService.getMood(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('mood/distinct/:clientNumber')
  async distinctMood(@Param() params: GetDistinctMoodDto) {
    return this.statsService.distinctMoodDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('mood')
  async updateMood(@Body() newMood: UpdateMoodDto) {
    return this.statsService.updateMood(newMood);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('mood')
  async deleteMood(@Body() deleteMood: DeleteMoodDto) {
    const kit = await this.kitsService.getOneKit(deleteMood.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      deleteMood.clientNumber,
      EStatsModels.MOOD_MODEL,
      deleteMood.day,
      deleteMood.checkin,
    );

    const deletedStat =
      addedStatsTodayLength > 1
        ? await this.statsService.deleteMoodWithoutKit(deleteMood.id)
        : await this.statsService.deleteMood(deleteMood);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength > 1 ? { stat: deletedStat } : deletedStat;
  }

  // Weight controllers
  //
  @UseGuards(new JwtAuthGuard())
  @Post('weight')
  async addWeight(@Body() weight: CreateWeightDto) {
    const kit = await this.kitsService.getOneKit(weight.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      weight.clientNumber,
      EStatsModels.WEIGHT_MODEL,
      weight.day,
      weight.checkin,
    );

    const newStat =
      addedStatsTodayLength === 0
        ? await this.statsService.createWeight(weight)
        : await this.statsService.createWeightWithoutKit(weight);

    if (!newStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength === 0 ? newStat : { stat: newStat };
  }

  @UseGuards(new JwtAuthGuard())
  @Get('weight/:clientNumber')
  async getWeight(@Param() params: GetWeightDto) {
    return this.statsService.getWeight(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('weight/distinct/:clientNumber')
  async distinctWeight(@Param() params: GetDistinctWeightDto) {
    return this.statsService.distinctWeightDates(params);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('weight')
  async updateWeight(@Body() newWeight: UpdateWeightDto) {
    return this.statsService.updateWeight(newWeight);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete('weight')
  async deleteWeight(@Body() deleteWeight: DeleteWeightDto) {
    const kit = await this.kitsService.getOneKit(deleteWeight.kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const addedStatsTodayLength = await this.statsService.getCountOfStatForDay(
      deleteWeight.clientNumber,
      EStatsModels.WEIGHT_MODEL,
      deleteWeight.day,
      deleteWeight.checkin,
    );

    const deletedStat =
      addedStatsTodayLength > 1
        ? await this.statsService.deleteWeightWithoutKit(deleteWeight.id)
        : await this.statsService.deleteWeight(deleteWeight);

    if (!deletedStat) {
      return httpExceptionStatError();
    }

    return addedStatsTodayLength > 1 ? { stat: deletedStat } : deletedStat;
  }

  // TODO remove it if we do not use it
  // Notes controllers
  //
  // @UseGuards(new JwtAuthGuard())
  // @Post('notes')
  // async addNotes(@Body() notes: CreateNotesDto) {
  //   const newStat = await this.statsService.createNotes(notes);

  //   if (!newStat) {
  //     return httpExceptionStatError();
  //   }

  //   return newStat;
  // }

  // @UseGuards(new JwtAuthGuard())
  // @Get('notes/:clientNumber')
  // async getNotes(@Param() params: GetNotesDto) {
  //   return this.statsService.getNotes(params);
  // }

  // @UseGuards(new JwtAuthGuard())
  // @Get('notes/distinct/:clientNumber')
  // async distinctNotes(@Param() params: GetDistinctNotesDto) {
  //   return this.statsService.distinctNotesDates(params);
  // }

  // @UseGuards(new JwtAuthGuard())
  // @Patch('notes')
  // async updateNotes(@Body() newNotes: UpdateNotesDto) {
  //   return this.statsService.updateNotes(newNotes);
  // }

  // @UseGuards(new JwtAuthGuard())
  // @Delete('notes')
  // async deleteNotes(@Body() deleteNotes: DeleteNotesDto) {
  //   const deletedStat = await this.statsService.deleteNotes(deleteNotes);

  //   if (!deletedStat) {
  //     return httpExceptionStatError();
  //   }

  //   return deletedStat;
  // }
}
