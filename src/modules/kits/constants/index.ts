import { EAllowedCheckinOptions } from '../../stats/constants';

export enum EAllowedKitCheckinName {
  FIRST = 'First check-in',
  SECOND = 'Second check-in',
}

export enum ELinkStatCheckinWithKitCheckins {
  'first',
  'second',
}

export enum EChatPropertyToCalc {
  'habits' = EAllowedCheckinOptions.REPEATABILITY_OF_THE_HABITS,
  'recommendations' = EAllowedCheckinOptions.RECOMMENDATION_TO_FOLLOW,
  'drugs' = EAllowedCheckinOptions.MEDICATIONS_INTAKE,
}
