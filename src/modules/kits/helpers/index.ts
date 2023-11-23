import { EAllowedCheckinOptions } from '../../stats/constants';
import { TStat } from '../../../utils/stats/types';
import {
  ELinkStatCheckinWithKitCheckins,
  EChatPropertyToCalc,
} from '../constants';
import * as moment from 'moment';
import { KitDocument } from '../models/kit.model';
import { ChatDocument } from '../../operator/models/chat.model';
import uniq = require('lodash/uniq');
import uniqBy = require('lodash/uniqBy');
import { KitCheckinDto } from '../dto/create-kit.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

export const getUpdatedFillingSuccessByChat = async (
  kit: KitDocument,
  chat: ChatDocument,
  promise: (option: EAllowedCheckinOptions) => Promise<TStat[]>,
) => {
  const optionsCheckinsLength = countLengthByOptionsCheckins(
    kit.checkins,
    chat,
  );

  let value = 0;

  const kitOptions = [];

  kit.checkins.forEach((checkin) => kitOptions.push(...checkin.options));

  const uniqKitOptions: EAllowedCheckinOptions[] = uniq(kitOptions);

  await Promise.all(
    uniqKitOptions.map(
      (option: EAllowedCheckinOptions) =>
        new Promise((resolve, reject) => {
          promise(option)
            .then((data) => ({ data, option }))
            .then((stats) => (stats ? resolve(stats) : reject(chat._id)));
        }),
    ),
  ).then(
    (
      statsArray: Array<{
        data: TStat[];
        option: EAllowedCheckinOptions;
      }>,
    ) => {
      value = statsArray.reduce(
        (acc, stats) =>
          acc +
          uniqBy(stats.data, 'checkin').filter((stat) => {
            const checkCheckins =
              kit.checkins[ELinkStatCheckinWithKitCheckins[stat.checkin]];
            if (checkCheckins)
              return checkCheckins.options.includes(stats.option);
            return false;
          }).length,
        0,
      );
    },
    (chatId) => {
      return calculateAddedStatError(chatId);
    },
  );

  const currentDate = moment().format('DD-MM-YYYY');

  const addToFillingSuccess = {
    date: currentDate,
    value,
    total: optionsCheckinsLength,
  };

  const previousFillingSuccess = chat.kit?.fillingSuccess;
  return previousFillingSuccess
    ? previousFillingSuccess
        .filter((item) => item.date !== currentDate)
        .concat(addToFillingSuccess)
    : [addToFillingSuccess];
};

export const countLengthByOptionsCheckins = (
  checkins: KitCheckinDto[],
  chat: ChatDocument,
) => {
  return (
    checkins.reduce((acc, cur) => acc + cur.options.length, 0) +
    calcItemsNumber(checkins, chat)
  );
};

const calcItemsNumber = (checkins: KitCheckinDto[], chat: ChatDocument) => {
  return Object.keys(EChatPropertyToCalc).reduce(
    (sum, prop) =>
      sum +
      checkins.reduce(
        (acc, checkin) =>
          acc +
          (checkin.options.includes(EChatPropertyToCalc[prop])
            ? chat[prop].length - 1
            : 0),
        0,
      ),
    0,
  );
};

export const calculateAddedStatError = (chatId: string): HttpException => {
  throw new HttpException(
    `Unable to calculate added stats for chat:${chatId}!`,
    HttpStatus.FORBIDDEN,
  );
};

export const assignChatToKitStatError = (): HttpException => {
  throw new HttpException(
    'Unable to update the list of assigned chats for the current kit',
    HttpStatus.FORBIDDEN,
  );
};
