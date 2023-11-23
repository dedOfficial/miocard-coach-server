import * as moment from 'moment';

export const getTimeForFilteringDailyNotes = (date: string) => ({
  start: moment(date).isValid()
    ? moment(date).startOf('day')
    : moment().subtract(100, 'year'),
  end: moment(date).isValid()
    ? moment(date).endOf('day')
    : moment().endOf('day'),
});
