import { EAllowedCheckinCheckboxes } from 'modules/stats/constants';

export const getCheckinProblemsAmount = (list): number =>
  list.reduce((acc, cur) => {
    if (
      cur.checkinCheckboxes.includes(EAllowedCheckinCheckboxes.IS_NO_PROBLEMS)
    ) {
      return acc;
    }

    return acc + 1;
  }, 0);
