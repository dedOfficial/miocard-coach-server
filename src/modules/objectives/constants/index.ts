import { OperatorForChat } from 'modules/operator/enums/operators-for-chat.enum';
import { EStatsDBKeyName, EStatsModels } from 'utils/stats/types';

export enum EAllowedObjectiveKeyResultTrackingParameters {
  'BLOOD_PRESSURE' = 'Blood pressure',
  'HEART_RATE' = 'Heart rate',
  'BODY_WEIGHT' = 'Body weight',
  'WALKED_DISTANCE' = 'Walked distance',
  'REPEATABILITY_OF_THE_HABITS' = 'Repeatability of the habits',
  'CHECK-IN_PROBLEMS' = 'Check-in problems',
  'PATIENT_RETURN' = 'Patient return',
  'PATIENT_SELF-EFFICACY' = 'Patient self-efficacy',
  'BP_MEASUREMENTS_FREQUENCY' = 'BP measurements frequency',
  'DATA_COLLECTION' = 'Data collection',
  'RECOMMENDATIONS_TO_FOLLOW' = 'Recommendations to follow',
}

export const AllOWED_OBJECTIVE_KEY_RESULT_TRACKING_PARAMETERS = [
  EAllowedObjectiveKeyResultTrackingParameters.BLOOD_PRESSURE,
  EAllowedObjectiveKeyResultTrackingParameters.REPEATABILITY_OF_THE_HABITS,
  EAllowedObjectiveKeyResultTrackingParameters['CHECK-IN_PROBLEMS'],
  EAllowedObjectiveKeyResultTrackingParameters.PATIENT_RETURN,
  EAllowedObjectiveKeyResultTrackingParameters['PATIENT_SELF-EFFICACY'],
  EAllowedObjectiveKeyResultTrackingParameters.BP_MEASUREMENTS_FREQUENCY,
  EAllowedObjectiveKeyResultTrackingParameters.DATA_COLLECTION,
  EAllowedObjectiveKeyResultTrackingParameters.RECOMMENDATIONS_TO_FOLLOW,
];

// TODO add PATIENT_RETURN, PATIENT_SELF-EFFICACY, BP_MEASUREMENTS_FREQUENCY
// TODO how to count Check-in problems, Patient return, Patient self-efficacy, BP measurements frequency, Data collection
export const OBJECTIVES_KEY_RESULTS_TRACKING_PARAMETER = {
  [EAllowedObjectiveKeyResultTrackingParameters.BLOOD_PRESSURE]:
    EStatsModels.CARDIO_MODEL,
  [EAllowedObjectiveKeyResultTrackingParameters.HEART_RATE]:
    EStatsModels.CARDIO_MODEL,
  [EAllowedObjectiveKeyResultTrackingParameters.BODY_WEIGHT]:
    EStatsModels.WEIGHT_MODEL,
  [EAllowedObjectiveKeyResultTrackingParameters.WALKED_DISTANCE]:
    EStatsModels.WALKED_DISTANCE_MODEL,
  [EAllowedObjectiveKeyResultTrackingParameters.REPEATABILITY_OF_THE_HABITS]:
    EStatsModels.HABIT_MODEL,
  [EAllowedObjectiveKeyResultTrackingParameters['CHECK-IN_PROBLEMS']]:
    EStatsModels.CHECKIN_MODEL,
  [EAllowedObjectiveKeyResultTrackingParameters.RECOMMENDATIONS_TO_FOLLOW]:
    EStatsModels.RECOMMENDATION_MODEL,
};

export const OBJECTIVES_KEY_RESULTS_STAT = {
  [EAllowedObjectiveKeyResultTrackingParameters.BLOOD_PRESSURE]:
    EStatsDBKeyName.PRESSURE,
  [EAllowedObjectiveKeyResultTrackingParameters.HEART_RATE]:
    EStatsDBKeyName.PULSE,
  [EAllowedObjectiveKeyResultTrackingParameters.BODY_WEIGHT]:
    EStatsDBKeyName.WEIGHT,
  [EAllowedObjectiveKeyResultTrackingParameters.WALKED_DISTANCE]:
    EStatsDBKeyName.WALKED_DISTANCE,
  [EAllowedObjectiveKeyResultTrackingParameters.REPEATABILITY_OF_THE_HABITS]:
    EStatsDBKeyName.HABIT,
  [EAllowedObjectiveKeyResultTrackingParameters['CHECK-IN_PROBLEMS']]:
    EStatsDBKeyName.CHECKIN,
  [EAllowedObjectiveKeyResultTrackingParameters['RECOMMENDATIONS_TO_FOLLOW']]:
    EStatsDBKeyName.RECOMMENDATION_TO_FOLLOW,
};

export enum EObjectiveReturnObjectsKey {
  ACTUAL = 'actual',
  MAX_LIMIT = 'max limit',
  NORM = 'norm',
  HIGHLIGHTED = 'highlighted',
}

export enum ETypeofOperatorId {
  OPERATOR_ID = 'operatorId',
  ASSISTANT_ID = 'assistantId',
}

export const TYPE_OF_OPERATOR_ID = {
  [OperatorForChat.COACH]: ETypeofOperatorId.OPERATOR_ID,
  [OperatorForChat.ASSISTANT]: ETypeofOperatorId.ASSISTANT_ID,
};

export enum EHighlightedColor {
  BLACK = 'black',
  GREEN = 'green',
  RED = 'red',
}
