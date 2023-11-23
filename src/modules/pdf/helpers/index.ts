import * as moment from 'moment';
import { EAllowedTimeOfDayAddingStat } from '../../stats/constants';

export const sortFunction = (a: { day: string }, b: { day: string }) => {
  if (
    moment(a.day, 'DD-MM-YYYY').valueOf() >
    moment(b.day, 'DD-MM-YYYY').valueOf()
  )
    return 1;
  if (
    moment(a.day, 'DD-MM-YYYY').valueOf() <
    moment(b.day, 'DD-MM-YYYY').valueOf()
  )
    return -1;
};

export const sortFunctionCardio = (
  a: { day: string; timeOfDay?: string },
  b: { day: string; timeOfDay?: string },
) => {
  if (
    moment(a.day, 'DD-MM-YYYY').valueOf() >
    moment(b.day, 'DD-MM-YYYY').valueOf()
  )
    return 1;
  if (
    moment(a.day, 'DD-MM-YYYY').valueOf() <
    moment(b.day, 'DD-MM-YYYY').valueOf()
  )
    return -1;
  else {
    if (a.timeOfDay === EAllowedTimeOfDayAddingStat.MORNING) return -1;
    if (
      a.timeOfDay === EAllowedTimeOfDayAddingStat.AFTERNOON &&
      b.timeOfDay !== EAllowedTimeOfDayAddingStat.MORNING
    )
      return -1;
    if (
      a.timeOfDay === EAllowedTimeOfDayAddingStat.EVENING &&
      b.timeOfDay !== EAllowedTimeOfDayAddingStat.NIGHT
    )
      return 1;
    if (a.timeOfDay === EAllowedTimeOfDayAddingStat.NIGHT) return 1;
  }
};
