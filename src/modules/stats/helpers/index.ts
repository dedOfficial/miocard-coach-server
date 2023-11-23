import { KitDocument } from '../../kits/models/kit.model';
import { EAllowedCheckinOptions } from '../constants';
import { Moment } from 'moment';

export const countLengthOfStatByKitOptions = (
  kit: KitDocument,
  stat: EAllowedCheckinOptions,
) =>
  kit.checkins.map(({ options }) => options.includes(stat)).filter(Boolean)
    .length;

export const DBHelperFindByPeriod = (start: Moment, end: Moment) => ({
  $and: [
    {
      $gte: [
        {
          $dateFromString: {
            dateString: '$day',
            format: '%d-%m-%Y',
          },
        },
        start.toDate(),
      ],
    },
    {
      $lte: [
        {
          $dateFromString: {
            dateString: '$day',
            format: '%d-%m-%Y',
          },
        },
        end.toDate(),
      ],
    },
  ],
});
