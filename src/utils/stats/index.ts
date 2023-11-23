import { HttpException, HttpStatus } from '@nestjs/common';

import {
  checkToNumber,
  computeAverageCardio,
  getPressureAndPulseFromString,
} from 'utils/common';
import {
  IGetAverageCardioValueForPeriod,
  TGetAverageCardioValueForPeriod,
  TStatWithFillingSuccess,
} from './types';
import { ChatDocument } from '../../modules/operator/models/chat.model';

export const statWithFillingSuccess = ({
  stat,
  fillingSuccess,
}: TStatWithFillingSuccess) => ({
  stat,
  fillingSuccess,
});

export const httpExceptionStatError = (): HttpException => {
  throw new HttpException(
    'Unable to update fillingSuccess for current chat!',
    HttpStatus.FORBIDDEN,
  );
};

export const statWasNotFoundError = (statName: string): HttpException => {
  throw new HttpException(`${statName} was not found`, HttpStatus.FORBIDDEN);
};

export enum ECardio {
  SYSTOLIC = 'systolic',
  DIASTOLIC = 'diastolic',
}

export const getAverageCardioValueForPeriod = (
  cardioList: TGetAverageCardioValueForPeriod,
): IGetAverageCardioValueForPeriod => {
  const averageCardioForPeriod = computeAverageCardio(cardioList);

  return getPressureAndPulseFromString(averageCardioForPeriod);
};

export const checkLastAddedFillingSuccess = (
  updatedFillingSuccess: ChatDocument['kit']['fillingSuccess'],
  day: string,
) => {
  const lastAddedFillingSuccess = updatedFillingSuccess.find(
    (item) => item.date === day,
  );

  if (
    !checkToNumber(lastAddedFillingSuccess?.value) ||
    !checkToNumber(lastAddedFillingSuccess?.total)
  ) {
    return httpExceptionStatError();
  }
};
