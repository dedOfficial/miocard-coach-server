import { FoodDocument } from '../../stats/models/food.model';
import { CardioDocument } from '../../stats/models/cardio.model';
import { DrugDocument } from '../../stats/models/drug.model';
import { SymptomDocument } from '../../stats/models/symptom.model';
import { WeightDocument } from '../../stats/models/weight.model';
import { MoodDocument } from '../../stats/models/mood.model';
import { WalkedDistanceDocument } from '../../stats/models/walked-distance.model';
import { HabitDocument } from '../../stats/models/habit.model';
import { CheckinDocument } from '../../stats/models/checkin.model';
import { RecommendationDocument } from 'modules/stats/models/recommendation.model';

export type DataExportStatsExcel = {
  food: Array<FoodDocument>;
  cardio: Array<CardioDocument>;
  drug: Array<DrugDocument>;
  symptom: Array<SymptomDocument>;
  weight: Array<WeightDocument>;
  mood: Array<MoodDocument>;
  walkedDistance: Array<WalkedDistanceDocument>;
  habit: Array<HabitDocument>;
  checkin: Array<CheckinDocument>;
  recommendations: Array<RecommendationDocument>;
};
