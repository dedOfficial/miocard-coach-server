import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';
import omit = require('lodash/omit');

import { Habit, HabitDocument } from './models/habit.model';
import {
  Recommendation,
  RecommendationDocument,
} from './models/recommendation.model';
import { Cardio, CardioDocument } from './models/cardio.model';
import { Food, FoodDocument } from './models/food.model';
import { Drug, DrugDocument } from './models/drug.model';
import { Symptom, SymptomDocument } from './models/symptom.model';
import { Weight, WeightDocument } from './models/weight.model';
import { Notes, NotesDocument } from './models/notes.model';
import { Mood, MoodDocument } from './models/mood.model';
import { Checkin, CheckinDocument } from './models/checkin.model';
import {
  WalkedDistance,
  WalkedDistanceDocument,
} from './models/walked-distance.model';
import { KitsService } from 'modules/kits/kits.service';
import { EStatAction } from 'types/common';
import {
  checkLastAddedFillingSuccess,
  statWithFillingSuccess,
} from 'utils/stats';
import { EPeriod, EPeriodOfTime, getStartAndEndOfPeriod } from 'utils/common';
import { EStatsDBKeyName, EStatsModels, TStat } from 'utils/stats/types';
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
  AddSymptomDto,
  DeleteSymptomDto,
  GetDistinctSymptomDto,
  GetSymptomDto,
  UpdateSymptomDto,
} from './dto/symptom.dto';
import {
  CreateFoodDto,
  GetDistinctFoodDto,
  GetFoodDto,
  DeleteFoodDto,
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
import {
  checkinCheckboxesWithProblemsList,
  EAllowedCheckinOptions,
} from './constants';
import {
  CreateRecommendationDto,
  DeleteRecommendationDto,
  GetDistinctRecommendationDto,
  GetRecommendationsDto,
  UpdateRecommendationDto,
} from './dto/recommendation.dto';
import { DBHelperFindByPeriod } from './helpers';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Cardio.name) private cardioModel: Model<CardioDocument>,
    @InjectModel(Food.name) private foodModel: Model<FoodDocument>,
    @InjectModel(Habit.name) private habitModel: Model<HabitDocument>,
    @InjectModel(Recommendation.name)
    private recommendationModel: Model<RecommendationDocument>,
    @InjectModel(Drug.name) private drugModel: Model<DrugDocument>,
    @InjectModel(Symptom.name) private symptomModel: Model<SymptomDocument>,
    @InjectModel(Weight.name) private weightModel: Model<WeightDocument>,
    @InjectModel(Notes.name) private notesModel: Model<NotesDocument>,
    @InjectModel(Mood.name) private moodModel: Model<MoodDocument>,
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
    @InjectModel(WalkedDistance.name)
    private walkedDistanceModel: Model<WalkedDistanceDocument>,
    private readonly kitsService: KitsService,
  ) {}

  private getCorrectDate(date: string, time: string) {
    const [day, month, year] = date.split('-');
    return `${month}-${day}-${year} ${time}`;
  }

  // Cardio
  //
  async createCardio(addCardioDto: AddCardioDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      addCardioDto.chatId,
      addCardioDto.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, addCardioDto.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      addCardioDto.chatId,
      EAllowedCheckinOptions['BLOOD_PRESSURE_AND_PULSE'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        addCardioDto.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(
        secondUpdatedFillingSuccess,
        addCardioDto.day,
      );
    }

    const measuredAt = new Date(
      this.getCorrectDate(addCardioDto.day, addCardioDto.time),
    );
    const createdStat = await new this.cardioModel({
      ...addCardioDto,
      measuredAt,
    }).save();
    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  createCardioWithoutKit(addCardioDto: AddCardioDto) {
    const measuredAt = new Date(
      this.getCorrectDate(addCardioDto.day, addCardioDto.time),
    );
    return new this.cardioModel({
      ...addCardioDto,
      measuredAt,
    }).save();
  }

  async updateCardio(newCardio: UpdateCardioDto) {
    return this.cardioModel.findByIdAndUpdate(
      newCardio.id,
      omit(newCardio, ['id']),
      {
        new: true,
        useFindAndModify: false,
      },
    );
  }

  async deleteCardio({ id: _id, chatId, day }: DeleteCardioDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['BLOOD_PRESSURE_AND_PULSE'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.cardioModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteCardioWithoutKit(_id: string) {
    return this.cardioModel.deleteOne({ _id }).exec();
  }

  getCardio({ clientNumber }: GetCardioDto) {
    return this.cardioModel.find({ clientNumber }).exec();
  }

  distinctCardioDates({ clientNumber }: GetCardioDto) {
    return this.cardioModel.distinct('day', { clientNumber }).exec();
  }

  findTodaysMeasurement(clientNumber: string) {
    const start = moment().startOf('day');
    const end = moment().endOf('day');

    return this.cardioModel.findOne({
      clientNumber,
      $expr: DBHelperFindByPeriod(start, end),
    });
  }

  // Checkin
  //
  async createCheckin(newCheckin: CreateCheckinDto) {
    const { chatId, day } = newCheckin;
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const measuredAt = new Date(
      this.getCorrectDate(newCheckin.day, newCheckin.time),
    );
    const createdStat = await new this.checkinModel({
      ...newCheckin,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  updateCheckin(updatedCheckin: UpdateCheckinDto) {
    return this.checkinModel.findByIdAndUpdate(
      updatedCheckin.id,
      omit(updatedCheckin, ['id']),
      { new: true, useFindAndModify: false },
    );
  }

  async deleteCheckin({ id: _id, chatId, day }: DeleteCheckinDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const deletedStat = await this.checkinModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteCheckinWithoutKit(_id: string) {
    return this.checkinModel.deleteOne({ _id }).exec();
  }

  getCheckins({ clientNumber }: GetCheckinDto) {
    return this.checkinModel.find({ clientNumber }).exec();
  }

  distinctCheckinDates({ clientNumber }: GetCheckinDto) {
    return this.checkinModel.distinct('day', { clientNumber }).exec();
  }

  getCheckinsGroupByTime({ clientNumber }: GetCheckinDto) {
    return this.checkinModel.aggregate([
      {
        $match: { clientNumber },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$measuredAt' } },
          checkinsList: { $push: '$$ROOT' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  // Return amount of checkins by client and by checkinCheckboxes without problems, so
  // this service return [{ amount: 1 }] or []
  getAmountOfCheckinsByClientNumberByChatIdByCheckinCheckboxesWithoutProblems(
    clientNumber: string,
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
    chatId: string,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    return this.checkinModel.aggregate([
      {
        $match: {
          clientNumber,
          chatId: chatId.toString(),
          isReceived: true,
          checkinCheckboxes: { $in: checkinCheckboxesWithProblemsList },
          $expr: DBHelperFindByPeriod(start, end),
        },
      },
      {
        $count: 'amount',
      },
    ]);
  }

  // Mood
  //
  async createMood(mood: CreateMoodDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      mood.chatId,
      mood.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, mood.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      mood.chatId,
      EAllowedCheckinOptions['MOOD'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        mood.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, mood.day);
    }

    const measuredAt = new Date(this.getCorrectDate(mood.day, mood.time));
    const createdStat = await new this.moodModel({
      ...mood,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  createMoodWithoutKit(mood: CreateMoodDto) {
    const measuredAt = new Date(this.getCorrectDate(mood.day, mood.time));

    return new this.moodModel({
      ...mood,
      measuredAt,
    }).save();
  }

  async updateMood(newMood: UpdateMoodDto) {
    return this.moodModel.findByIdAndUpdate(newMood.id, omit(newMood, ['id']), {
      new: true,
      useFindAndModify: false,
    });
  }

  async deleteMood({ id: _id, chatId, day }: DeleteMoodDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['MOOD'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.moodModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteMoodWithoutKit(_id: string) {
    return this.moodModel.deleteOne({ _id }).exec();
  }

  getMood({ clientNumber }: GetMoodDto) {
    return this.moodModel.find({ clientNumber }).exec();
  }

  distinctMoodDates({ clientNumber }: GetDistinctMoodDto) {
    return this.moodModel.distinct('day', { clientNumber }).exec();
  }

  // Meals and Food
  //
  async createFood(food: CreateFoodDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      food.chatId,
      food.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, food.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      food.chatId,
      EAllowedCheckinOptions['FOOD_INTAKE'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        food.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, food.day);
    }

    const measuredAt = new Date(this.getCorrectDate(food.day, food.time));
    const createdStat = await new this.foodModel({
      ...food,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  createFoodWithoutKit(createFoodDto: CreateFoodDto) {
    const measuredAt = new Date(
      this.getCorrectDate(createFoodDto.day, createFoodDto.time),
    );
    return new this.foodModel({
      ...createFoodDto,
      measuredAt,
    }).save();
  }

  async updateFood(newFood: UpdateFoodDto) {
    return this.foodModel.findByIdAndUpdate(newFood.id, omit(newFood, ['id']), {
      new: true,
      useFindAndModify: false,
    });
  }

  async deleteFood({ id: _id, chatId, day }: DeleteFoodDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['FOOD_INTAKE'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.foodModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteFoodWithoutKit(_id: string) {
    return this.foodModel.deleteOne({ _id }).exec();
  }

  getFood({ clientNumber }: GetFoodDto) {
    return this.foodModel.find({ clientNumber }).exec();
  }

  distinctFoodDates({ clientNumber }: GetDistinctFoodDto) {
    return this.foodModel.distinct('day', { clientNumber }).exec();
  }

  // Habits
  //
  async createHabit(newHabit: CreateHabitDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      newHabit.chatId,
      newHabit.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, newHabit.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      newHabit.chatId,
      EAllowedCheckinOptions['REPEATABILITY_OF_THE_HABITS'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        newHabit.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, newHabit.day);
    }

    const measuredAt = new Date(
      this.getCorrectDate(newHabit.day, newHabit.time),
    );
    const createdStat = await new this.habitModel({
      ...newHabit,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  createHabitWithoutKit(newHabit: CreateHabitDto) {
    const measuredAt = new Date(
      this.getCorrectDate(newHabit.day, newHabit.time),
    );
    return new this.habitModel({
      ...newHabit,
      measuredAt,
    }).save();
  }

  async updateHabit(newHabit: UpdateHabitDto) {
    return this.habitModel.findByIdAndUpdate(
      newHabit.id,
      omit(newHabit, ['id']),
      { new: true, useFindAndModify: false },
    );
  }

  async deleteHabit({ id: _id, chatId, day }: DeleteHabitDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['REPEATABILITY_OF_THE_HABITS'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.habitModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteHabitWithoutKit(_id: string) {
    return this.habitModel.deleteOne({ _id }).exec();
  }

  getHabits({ clientNumber }: GetHabitsDto) {
    return this.habitModel.find({ clientNumber }).exec();
  }

  distinctHabitDates({ clientNumber }: GetDistinctHabitDto) {
    return this.habitModel.distinct('day', { clientNumber }).exec();
  }

  getHabitsByHabitIdByClientByPeriod(
    clientNumber: string,
    habitId: string,
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];
    return this.habitModel
      .find({
        clientNumber,
        habitId,
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .exec();
  }

  // Recommendations
  //
  async createRecommendation(newRecommendation: CreateRecommendationDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      newRecommendation.chatId,
      newRecommendation.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, newRecommendation.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      newRecommendation.chatId,
      EAllowedCheckinOptions['RECOMMENDATION_TO_FOLLOW'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        newRecommendation.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(
        secondUpdatedFillingSuccess,
        newRecommendation.day,
      );
    }

    const measuredAt = new Date(
      this.getCorrectDate(newRecommendation.day, newRecommendation.time),
    );
    const createdStat = await new this.recommendationModel({
      ...newRecommendation,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  async updateRecommendation({ id, repeatability }: UpdateRecommendationDto) {
    return this.recommendationModel.findByIdAndUpdate(
      id,
      { repeatability },
      { new: true, useFindAndModify: false },
    );
  }

  async deleteRecommendation({
    id: _id,
    chatId,
    day,
  }: DeleteRecommendationDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['RECOMMENDATION_TO_FOLLOW'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.recommendationModel
      .deleteOne({ _id })
      .exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  getRecommendations({ clientNumber }: GetRecommendationsDto) {
    return this.recommendationModel.find({ clientNumber }).exec();
  }

  getRecommendationsVerbose({ clientNumber }: GetHabitsDto) {
    return this.recommendationModel.aggregate([
      { $match: { clientNumber } },
      {
        $lookup: {
          from: 'chats',
          localField: 'recommendationId',
          foreignField: 'recommendations.id',
          as: 'recommendationTitle',
        },
      },
      {
        $set: {
          recommendationTitle: {
            $arrayElemAt: ['$recommendationTitle.recommendations.name', 0],
          },
        },
      },
    ]);
  }

  distinctRecommendationDates({ clientNumber }: GetDistinctRecommendationDto) {
    return this.recommendationModel.distinct('day', { clientNumber }).exec();
  }

  getRecommendationsByIdByClientByPeriod(
    clientNumber: string,
    recommendationId: string,
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    return this.recommendationModel
      .find({
        clientNumber,
        recommendationId,
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .exec();
  }

  // Drugs
  //
  async createDrug(drug: CreateDrugDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      drug.chatId,
      drug.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, drug.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      drug.chatId,
      EAllowedCheckinOptions['MEDICATIONS_INTAKE'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        drug.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, drug.day);
    }

    const measuredAt = new Date(this.getCorrectDate(drug.day, drug.time));
    const createdStat = await new this.drugModel({
      ...drug,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  createDrugWithoutKit(drug: CreateDrugDto) {
    const measuredAt = new Date(this.getCorrectDate(drug.day, drug.time));
    return new this.drugModel({
      ...drug,
      measuredAt,
    }).save();
  }

  async updateDrug(newDrug: UpdateDrugDto) {
    return this.drugModel.findByIdAndUpdate(newDrug.id, omit(newDrug, ['id']), {
      new: true,
      useFindAndModify: false,
    });
  }

  async deleteDrug({ id: _id, chatId, day }: DeleteDrugDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['MEDICATIONS_INTAKE'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.drugModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteDrugWithoutKit(_id: string) {
    return this.drugModel.deleteOne({ _id }).exec();
  }

  getDrug({ clientNumber }: GetDrugDto) {
    return this.drugModel.find({ clientNumber }).exec();
  }

  getDrugsByDrugIdByClientByPeriod(
    clientNumber: string,
    drugId: string,
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    return this.drugModel
      .find({
        clientNumber,
        drugId,
        isReceived: true,
        measuredAt: {
          $gte: start.toDate(),
          $lte: end.toDate(),
        },
      })
      .exec();
  }

  distinctDrugDates({ clientNumber }: GetDistinctDrugDto) {
    return this.drugModel.distinct('day', { clientNumber }).exec();
  }

  // Symptom
  //
  async createSymptom(newSymptom: AddSymptomDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      newSymptom.chatId,
      newSymptom.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, newSymptom.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      newSymptom.chatId,
      EAllowedCheckinOptions['SYMPTOMS'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        newSymptom.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, newSymptom.day);
    }

    const measuredAt = new Date(
      this.getCorrectDate(newSymptom.day, newSymptom.time),
    );
    const createdStat = await new this.symptomModel({
      ...newSymptom,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  createSymptomWithoutKit(newSymptom: AddSymptomDto) {
    return new this.symptomModel(newSymptom).save();
  }

  async updateSymptom(newSymptom: UpdateSymptomDto) {
    return this.symptomModel.findByIdAndUpdate(
      newSymptom.id,
      omit(newSymptom, ['id']),
      { new: true, useFindAndModify: false },
    );
  }

  async deleteSymptom({ id: _id, chatId, day }: DeleteSymptomDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['SYMPTOMS'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.symptomModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteSymptomWithoutKit(_id: string) {
    return this.symptomModel.deleteOne({ _id }).exec();
  }

  getSymptom({ clientNumber }: GetSymptomDto) {
    return this.symptomModel.find({ clientNumber }).exec();
  }

  distinctSymptomDates({ clientNumber }: GetDistinctSymptomDto) {
    return this.symptomModel.distinct('day', { clientNumber }).exec();
  }

  // WalkedDistance
  async createWalkedDistance(walkedDistance: CreateWalkedDistanceDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      walkedDistance.chatId,
      walkedDistance.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, walkedDistance.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      walkedDistance.chatId,
      EAllowedCheckinOptions['WALKED_DISTANCE'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        walkedDistance.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(
        secondUpdatedFillingSuccess,
        walkedDistance.day,
      );
    }

    const measuredAt = new Date(
      this.getCorrectDate(walkedDistance.day, walkedDistance.time),
    );
    const createdStat = await new this.walkedDistanceModel({
      ...walkedDistance,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  createWalkedDistanceWithoutKit(walkedDistance: CreateWalkedDistanceDto) {
    const measuredAt = new Date(
      this.getCorrectDate(walkedDistance.day, walkedDistance.time),
    );
    return new this.walkedDistanceModel({
      ...walkedDistance,
      measuredAt,
    }).save();
  }

  async updateWalkedDistance(newWalkedDistance: UpdateWalkedDistanceDto) {
    return this.walkedDistanceModel.findByIdAndUpdate(
      newWalkedDistance.id,
      omit(newWalkedDistance, ['id']),
      { new: true, useFindAndModify: false },
    );
  }

  async deleteWalkedDistance({
    id: _id,
    chatId,
    day,
  }: DeleteWalkedDistanceDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['WALKED_DISTANCE'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.walkedDistanceModel
      .deleteOne({ _id })
      .exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteWalkedDistanceWithoutKit(_id: string) {
    return this.walkedDistanceModel.deleteOne({ _id }).exec();
  }

  getWalkedDistance({ clientNumber }: GetWalkedDistanceDto) {
    return this.walkedDistanceModel.find({ clientNumber }).exec();
  }

  distinctWalkedDistanceDates({ clientNumber }: GetDistinctWalkedDistanceDto) {
    return this.walkedDistanceModel.distinct('day', { clientNumber }).exec();
  }

  // Weight
  //
  async createWeight(weight: CreateWeightDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      weight.chatId,
      weight.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, weight.day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      weight.chatId,
      EAllowedCheckinOptions['BODY_WEIGHT'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        weight.day,
        EStatAction.ADD,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, weight.day);
    }

    const measuredAt = new Date(this.getCorrectDate(weight.day, weight.time));
    const createdStat = await new this.weightModel({
      ...weight,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  createWeightWithoutKit(weight: CreateWeightDto) {
    const measuredAt = new Date(this.getCorrectDate(weight.day, weight.time));
    return new this.weightModel({
      ...weight,
      measuredAt,
    }).save();
  }

  async updateWeight(newWeight: UpdateWeightDto) {
    return this.weightModel.findByIdAndUpdate(
      newWeight.id,
      omit(newWeight, ['id']),
      { new: true, useFindAndModify: false },
    );
  }

  async deleteWeight({ id: _id, chatId, day }: DeleteWeightDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const {
      isMatch,
      twinChatId,
    } = await this.kitsService.findMatchChatKitOptionsByClient(
      chatId,
      EAllowedCheckinOptions['BODY_WEIGHT'],
    );

    if (isMatch) {
      const secondUpdatedFillingSuccess = await this.kitsService.updateFillingSuccess(
        twinChatId,
        day,
        EStatAction.REMOVE,
      );

      checkLastAddedFillingSuccess(secondUpdatedFillingSuccess, day);
    }

    const deletedStat = await this.weightModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  deleteWeightWithoutKit(_id: string) {
    return this.weightModel.deleteOne({ _id }).exec();
  }

  getWeight({ clientNumber }: GetWeightDto) {
    return this.weightModel.find({ clientNumber }).exec();
  }

  distinctWeightDates({ clientNumber }: GetDistinctWeightDto) {
    return this.weightModel.distinct('day', { clientNumber }).exec();
  }

  // Notes
  //
  async createNotes(notes: CreateNotesDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      notes.chatId,
      notes.day,
      EStatAction.ADD,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, notes.day);

    const measuredAt = new Date(this.getCorrectDate(notes.day, notes.time));
    const createdStat = await new this.notesModel({
      ...notes,
      measuredAt,
    }).save();

    return statWithFillingSuccess({
      stat: createdStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  async updateNotes({ id, notes }: UpdateNotesDto) {
    return this.notesModel.findByIdAndUpdate(
      id,
      { notes },
      { new: true, useFindAndModify: false },
    );
  }

  async deleteNotes({ id: _id, chatId, day }: DeleteNotesDto) {
    const updatedFillingSuccess = await this.kitsService.updateFillingSuccess(
      chatId,
      day,
      EStatAction.REMOVE,
    );

    checkLastAddedFillingSuccess(updatedFillingSuccess, day);

    const deletedStat = await this.notesModel.deleteOne({ _id }).exec();

    return statWithFillingSuccess({
      stat: deletedStat,
      fillingSuccess: updatedFillingSuccess,
    });
  }

  getNotes({ clientNumber }: GetNotesDto) {
    return this.notesModel.find({ clientNumber }).exec();
  }

  distinctNotesDates({ clientNumber }: GetDistinctNotesDto) {
    return this.notesModel.distinct('day', { clientNumber }).exec();
  }

  // Common for all stats
  async getLastAddedClientStat(
    clientNumber: string,
    model: EStatsModels,
  ): Promise<TStat> {
    const definedModule = this?.[model];

    if (!definedModule) {
      return;
    }

    return definedModule
      .findOne({ clientNumber, isReceived: true })
      .sort({ measuredAt: 'desc' })
      .exec();
  }

  async getClientStatForCurrentDay(
    clientNumber: string,
    model: EStatsModels,
    date = moment(new Date()).format('DD-MM-YYYY'),
  ): Promise<TStat[]> {
    const definedModule = this?.[model] as any;

    if (!definedModule) {
      return;
    }

    return definedModule
      .find({
        clientNumber,
        day: date,
      })
      .exec();
  }

  getStatValuesByClientByPeriod(
    clientNumber: string,
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
    model: EStatsModels,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    // TODO typescript
    const definedModule = this?.[model] as any;

    if (!definedModule) {
      return;
    }

    return definedModule
      .find({
        clientNumber,
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .exec();
  }

  getMaxStatValueByPeriod(
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
    model: EStatsModels,
    byProperty: EStatsDBKeyName,
  ): Promise<TStat> {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    const definedModule = this?.[model];

    if (!definedModule) {
      return;
    }

    return definedModule
      .findOne({
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .sort({ [byProperty]: -1 })
      .exec();
  }

  getStatValuesByPeriod(
    period: EPeriod,
    periodOfTime: EPeriodOfTime,
    model: EStatsModels,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    // TODO typescript
    const definedModule = this?.[model] as any;

    if (!definedModule) {
      return;
    }

    return definedModule
      .find({
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .exec();
  }

  findCardioStatByClientNumberAndDate(
    clientNumber: string,
    periodOfTime: EPeriodOfTime,
    period: EPeriod,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    return this.cardioModel
      .find({
        clientNumber,
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .exec();
  }

  findCardioStatByClientNumberByChatIdAndDate(
    clientNumber: string,
    periodOfTime: EPeriodOfTime,
    period: EPeriod,
    chatId: string,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    return this.cardioModel
      .find({
        clientNumber,
        chatId: chatId.toString(),
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .exec();
  }

  getCountOfStatForDay(
    clientNumber: string,
    model: EStatsModels,
    day: string,
    checkin: string,
  ) {
    const definedModule = this?.[model] as any;

    if (!definedModule) {
      return;
    }

    return definedModule
      .countDocuments({
        clientNumber,
        day,
        checkin,
      })
      .exec();
  }

  // Return amount of unique stats for one day, for example, we get 2 cardio stat yesterday, so
  // this service return [{ amount: 1 }], if there are not any stat we get []
  getAmountOfUniqueStatsByChatPerDay(
    clientNumber: string,
    periodOfTime: EPeriodOfTime,
    period: EPeriod,
    model: EStatsModels,
    chatId: string,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    const definedModule = this?.[model];

    return definedModule.aggregate([
      {
        $match: {
          clientNumber,
          chatId: chatId.toString(),
          isReceived: true,
          $expr: DBHelperFindByPeriod(start, end),
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%d-%m-%Y', date: '$measuredAt' } },
        },
      },
      {
        $count: 'amount',
      },
    ]);
  }

  findStatByClientNumberAndDate(
    clientNumber: string,
    periodOfTime: EPeriodOfTime,
    period: EPeriod,
    model: EStatsModels,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    // TODO typescript
    const definedModule = this?.[model] as any;

    if (!definedModule) {
      return;
    }

    return definedModule
      .find({
        clientNumber,
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .exec();
  }

  findStatByClientNumberByChatIdAndDate(
    clientNumber: string,
    periodOfTime: EPeriodOfTime,
    period: EPeriod,
    model: EStatsModels,
    chatId: string,
  ) {
    const { start, end } = getStartAndEndOfPeriod(periodOfTime)[period];

    // TODO typescript
    const definedModule = this?.[model] as any;

    if (!definedModule) {
      return;
    }

    return definedModule
      .find({
        clientNumber,
        chatId: chatId.toString(),
        isReceived: true,
        $expr: DBHelperFindByPeriod(start, end),
      })
      .exec();
  }

  deleteStatsByChat(clientNumber: string, model: EStatsModels) {
    const definedModule = this?.[model] as any;

    if (!definedModule) {
      return;
    }

    return definedModule.deleteMany({ clientNumber }).exec();
  }
}
