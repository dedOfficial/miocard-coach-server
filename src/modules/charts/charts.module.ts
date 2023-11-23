import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'modules/operator/models/chat.model';
import { Cardio, CardioSchema } from 'modules/stats/models/cardio.model';
import { Checkin, CheckinSchema } from 'modules/stats/models/checkin.model';
import { Drug, DrugSchema } from 'modules/stats/models/drug.model';
import { Food, FoodSchema } from 'modules/stats/models/food.model';
import { Habit, HabitSchema } from 'modules/stats/models/habit.model';
import { Mood, MoodSchema } from 'modules/stats/models/mood.model';
import { Notes, NotesSchema } from 'modules/stats/models/notes.model';
import { Symptom, SymptomSchema } from 'modules/stats/models/symptom.model';
import {
  WalkedDistance,
  WalkedDistanceSchema,
} from 'modules/stats/models/walked-distance.model';
import { Weight, WeightSchema } from 'modules/stats/models/weight.model';
import { ChartsController } from './charts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cardio.name, schema: CardioSchema },
      { name: Drug.name, schema: DrugSchema },
      { name: Weight.name, schema: WeightSchema },
      { name: Symptom.name, schema: SymptomSchema },
      { name: Mood.name, schema: MoodSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
  ],
  controllers: [ChartsController],
})
export class ChartsModule {}
