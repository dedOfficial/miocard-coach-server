import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Cardio, CardioSchema } from './models/cardio.model';
import { Food, FoodSchema } from './models/food.model';
import { Habit, HabitSchema } from './models/habit.model';
import { Drug, DrugSchema } from './models/drug.model';
import { Symptom, SymptomSchema } from './models/symptom.model';
import { Weight, WeightSchema } from './models/weight.model';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Notes, NotesSchema } from './models/notes.model';
import { Mood, MoodSchema } from './models/mood.model';
import { Checkin, CheckinSchema } from './models/checkin.model';
import {
  WalkedDistance,
  WalkedDistanceSchema,
} from './models/walked-distance.model';
import { KitsModule } from 'modules/kits/kits.module';
import { ChatModule } from 'modules/chat/chat.module';
import {
  Recommendation,
  RecommendationSchema,
} from './models/recommendation.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cardio.name, schema: CardioSchema },
      { name: Food.name, schema: FoodSchema },
      { name: Habit.name, schema: HabitSchema },
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: Drug.name, schema: DrugSchema },
      { name: Symptom.name, schema: SymptomSchema },
      { name: Weight.name, schema: WeightSchema },
      { name: Notes.name, schema: NotesSchema },
      { name: Mood.name, schema: MoodSchema },
      { name: WalkedDistance.name, schema: WalkedDistanceSchema },
      { name: Checkin.name, schema: CheckinSchema },
    ]),
    KitsModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
