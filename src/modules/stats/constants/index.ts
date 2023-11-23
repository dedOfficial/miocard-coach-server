import { EStatsModels } from '../../../utils/stats/types';

export enum EAllowedCheckinOptions {
  'BLOOD_PRESSURE_AND_PULSE' = 'Blood pressure and pulse',
  'BODY_WEIGHT' = 'Body weight',
  'FOOD_INTAKE' = 'Food intake',
  'MEDICATIONS_INTAKE' = 'Medications intake',
  'MOOD' = 'Mood',
  'REPEATABILITY_OF_THE_HABITS' = 'Repeatability of the habits',
  SYMPTOMS = 'Symptoms',
  'WALKED_DISTANCE' = 'Walked distance',
  'CHECK-IN_PROBLEMS' = 'Check-in problems',
  'RECOMMENDATION_TO_FOLLOW' = 'Recommendations to follow',
}

export const STATS_OPTIONS = {
  [EAllowedCheckinOptions.BLOOD_PRESSURE_AND_PULSE]: {
    title: 'Blood pressure and Pulse',
    storeStatsType: 'cardio',
    storeStatsDateType: 'cardioDates',
    type: 'cardio',
    model: EStatsModels.CARDIO_MODEL,
  },
  [EAllowedCheckinOptions.BODY_WEIGHT]: {
    title: 'Weight',
    storeStatsType: 'weight',
    storeStatsDateType: 'weightDates',
    type: 'weight',
    model: EStatsModels.WEIGHT_MODEL,
    text: 'lbs',
  },
  [EAllowedCheckinOptions.FOOD_INTAKE]: {
    title: 'Meals',
    storeStatsType: 'meals',
    storeStatsDateType: 'mealDates',
    type: 'food',
    model: EStatsModels.FOOD_MODEL,
  },
  [EAllowedCheckinOptions.MEDICATIONS_INTAKE]: {
    title: 'Medications',
    storeStatsType: 'drugs',
    storeStatsDateType: 'drugDates',
    type: 'drug',
    model: EStatsModels.DRUG_MODEL,
  },
  [EAllowedCheckinOptions.MOOD]: {
    title: 'Mood',
    storeStatsType: 'mood',
    storeStatsDateType: 'moodDates',
    type: 'mood',
    model: EStatsModels.MOOD_MODEL,
  },
  [EAllowedCheckinOptions.REPEATABILITY_OF_THE_HABITS]: {
    title: 'Habits to change or reduce',
    storeStatsType: 'habits',
    storeStatsDateType: 'habitDates',
    type: 'habit',
    model: EStatsModels.HABIT_MODEL,
  },
  [EAllowedCheckinOptions.RECOMMENDATION_TO_FOLLOW]: {
    title: 'Recommendations to follow',
    storeStatsType: 'recommendations',
    storeStatsDateType: 'recommendationDates',
    type: 'recommendation',
    model: 'recommendationModel',
  },
  [EAllowedCheckinOptions.SYMPTOMS]: {
    title: 'Symptoms',
    storeStatsType: 'symptoms',
    storeStatsDateType: 'symptomDates',
    type: 'symptom',
    model: EStatsModels.SYMPTOM_MODEL,
  },
  [EAllowedCheckinOptions.WALKED_DISTANCE]: {
    title: 'Walked Distance',
    storeStatsType: 'walkedDistances',
    storeStatsDateType: 'walkedDistanceDates',
    type: 'walkedDistance',
    model: EStatsModels.WALKED_DISTANCE_MODEL,
    text: 'miles',
  },
  [EAllowedCheckinOptions['CHECK-IN_PROBLEMS']]: {
    title: 'Check-in problems',
    storeStatsType: 'checkins',
    storeStatsDateType: 'checkinsDates',
    type: 'checkin',
    model: EStatsModels.CHECKIN_MODEL,
  },
};

export enum EAllowedCheckinCheckboxes {
  IS_LATE = 'isLate',
  IS_INTERRUPT = 'isInterrupt',
  IS_NOT_GET_IN_TOUCH = 'isNotGetInTouch',
  IS_POSTPONE = 'isPostpone',
  IS_RUSHES = 'isRushes',
  IS_COMPLAIN = 'isComplain',
  IS_PROBLEMS = 'isProblems',
  IS_LONG_TIME = 'isLongTime',
  IS_NOT_PARTICIPATE = 'isNotParticipate',
  IS_BUSY = 'isBusy',
  IS_NO_PROBLEMS = 'isNoProblems',
}

export const checkinCheckboxesWithProblemsList = Object.values(
  EAllowedCheckinCheckboxes,
).filter((checkin) => checkin !== EAllowedCheckinCheckboxes['IS_NO_PROBLEMS']);

export enum EAllowedCheckinNumber {
  FIRST = 'first',
  SECOND = 'second',
}

export const AllOWED_CHECKIN_NUMBER = [
  EAllowedCheckinNumber.FIRST,
  EAllowedCheckinNumber.SECOND,
];

export enum EAllowedTimeOfDayAddingStat {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
}

export const AllOWED_TIME_OF_DAY_ADDING_STAT = [
  EAllowedTimeOfDayAddingStat.MORNING,
  EAllowedTimeOfDayAddingStat.AFTERNOON,
  EAllowedTimeOfDayAddingStat.EVENING,
  EAllowedTimeOfDayAddingStat.NIGHT,
];

export enum EAllowedNotReceivedReasons {
  SKIPPED_COACHING = 'Skipped coaching',
  MISSED_MEASUREMENTS = 'Missed measurements',
  PROBLEMS_WITH_DEVICES = 'Problems with devices',
}

export const AllOWED_NOT_RECEIVED_REASONS = [
  EAllowedNotReceivedReasons.SKIPPED_COACHING,
  EAllowedNotReceivedReasons.MISSED_MEASUREMENTS,
  EAllowedNotReceivedReasons.PROBLEMS_WITH_DEVICES,
];

export const REG_EX_PRESSURE_FORMAT = /^[1-9][0-9]{1,2}[/][1-9][0-9]{1,2}$/;
export const REG_EX_PRESSURE_MESSAGE_ERROR =
  'The Pressure should come through the slash in a similar format as 120/80';

export enum initialJobDescriptionsEnum {
  'DONT_WORK' = 'Do not work',
  'ASSOCIATED_WITH_MENTAL_ACT' = 'Mainly associated with mental activity',
  'ASSOCIATED_WITH_PHYSICAL_ACT' = 'Mainly associated with physical activity',
  'WORK_AT_HOME' = 'Work at home',
  'OFTEN_HAS_BUSINESS_TRIPS_TO_OTHER_COUNTRIES' = 'often has business trips to other countries',
}
export const initialJobDescriptions = [
  initialJobDescriptionsEnum.DONT_WORK,
  initialJobDescriptionsEnum.ASSOCIATED_WITH_MENTAL_ACT,
  initialJobDescriptionsEnum.ASSOCIATED_WITH_PHYSICAL_ACT,
  initialJobDescriptionsEnum.WORK_AT_HOME,
  initialJobDescriptionsEnum.OFTEN_HAS_BUSINESS_TRIPS_TO_OTHER_COUNTRIES,
];

export enum initialCardioDiseasesEnum {
  'NONE' = 'None',
  'PREHYPERTENSION' = 'prehypertension',
  'HYPERTENSION_HIGHT_PRESSURE' = 'hypertension (high blood pressure)',
  'HYPERTENSION_LOW_PRESSURE' = 'hypertension (low blood pressure)',
  'ISCHEMIC_HEART_DISEASE' = 'ischemic heart disease (heart attack)',
  'DISORDERS_OF_CEREBRAL_CIRCULATION' = 'Disorders of cerebral circulation (stroke)',
  'CONGENITAL_HEART_DEFECTS' = 'Congenital heart defects',
  'CARDIOMYOPATHY' = 'Cardiomyopathy',
  'RHYTM_AND_CONDUCTION_DISORDERS' = 'Rhytm and conduction disorders',
}

export const initialCardioDiseases = [
  initialCardioDiseasesEnum.NONE,
  initialCardioDiseasesEnum.PREHYPERTENSION,
  initialCardioDiseasesEnum.HYPERTENSION_HIGHT_PRESSURE,
  initialCardioDiseasesEnum.HYPERTENSION_LOW_PRESSURE,
  initialCardioDiseasesEnum.ISCHEMIC_HEART_DISEASE,
  initialCardioDiseasesEnum.DISORDERS_OF_CEREBRAL_CIRCULATION,
  initialCardioDiseasesEnum.CONGENITAL_HEART_DEFECTS,
  initialCardioDiseasesEnum.CARDIOMYOPATHY,
  initialCardioDiseasesEnum.RHYTM_AND_CONDUCTION_DISORDERS,
];

export enum initialRelativeDiseasesEnum {
  'NONE' = 'None',
  'GRANDP_AUNT' = 'Grandparent, aunt/uncle, cousins',
  'PARENTS_BROTHER_CHILD' = 'Parents, brother/sister, or own child',
}

export const initialRelativeDiseases = [
  initialRelativeDiseasesEnum.NONE,
  initialRelativeDiseasesEnum.GRANDP_AUNT,
  initialRelativeDiseasesEnum.PARENTS_BROTHER_CHILD,
];

export enum initialChronicDiseasesEnum {
  'RASPIRATORY' = 'Raspiratory diseases (bronchitis, asthma, etc.)',
  'DISEASES_OF_GENITOURINARY' = 'Diseases of the genirourinary sistem (renal failure, cystitis, etc.)',
  'DISEASES_OF_DIGESTIVE' = 'Diseases of the digestive system (ulcer, pancreatitis, gallstone disease, gastritis, etc.)',
  'MENTAL_ILLNESS' = 'Mental illness (bipolar affective disorder, depression, schizophrenia, etc.)',
  'ENDOCRINE_DISEASES' = 'Endocrine diseases (diabets, Itsenko-Cushing, Nodular goiter, etc.)',
  'ONCOLOGY' = 'Oncology (write Another answer which of oncology)',
}

export const initialChronicDiseases = [
  initialChronicDiseasesEnum.RASPIRATORY,
  initialChronicDiseasesEnum.DISEASES_OF_GENITOURINARY,
  initialChronicDiseasesEnum.DISEASES_OF_DIGESTIVE,
  initialChronicDiseasesEnum.MENTAL_ILLNESS,
  initialChronicDiseasesEnum.ENDOCRINE_DISEASES,
  initialChronicDiseasesEnum.ONCOLOGY,
];

export enum EAllowedDrugValues {
  TAKEN = 'Taken',
  NOT_TAKEN = 'Not taken',
  MISSED = '',
}
