import {
  initialCardioDiseasesEnum,
  initialChronicDiseasesEnum,
  initialJobDescriptionsEnum,
  initialRelativeDiseasesEnum,
} from 'modules/stats/constants';

//

export enum EStatAction {
  REMOVE = -1,
  ADD = 1,
}

export type initial_statusesType = {
  initialJobDescriptions: initialJobDescriptionsEnum[];
  initialCardioDiseases: initialCardioDiseasesEnum[];
  initialRelativeDiseases: initialRelativeDiseasesEnum[];
  initialChronicDiseases: initialChronicDiseasesEnum[];
};
