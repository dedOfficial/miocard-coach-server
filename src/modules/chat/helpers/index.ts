import * as moment from 'moment';

import { ChatDocument } from 'modules/operator/models/chat.model';

export const assignOperatorToChat = (requests: Promise<ChatDocument>[]) => {
  return Promise.all(requests)
    .then((chats) => {
      const foundNegativeValue = chats.some((chat) => !chat);

      if (foundNegativeValue) {
        return false;
      }

      return true;
    })
    .catch(() => {
      return false;
    });
};

export const getTimeForFilteringChats = (date: string) => ({
  start: moment(date).isValid()
    ? moment(date).startOf('day')
    : moment().subtract(100, 'year'),
  end: moment(date).isValid()
    ? moment(date).endOf('day')
    : moment().endOf('day'),
});
