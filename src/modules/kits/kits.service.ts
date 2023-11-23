import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  AssignChatsToKitDto,
  CreateAndUpdateKitDto,
} from './dto/create-kit.dto';
import { Kit, KitDocument } from './models/kit.model';
import { EStatAction } from 'types/common';
import {
  countLengthByOptionsCheckins,
  assignChatToKitStatError,
  getUpdatedFillingSuccessByChat,
} from './helpers';
import { StatsService } from 'modules/stats/stats.service';
import { Chat, ChatDocument } from 'modules/operator/models/chat.model';
import { EAllowedCheckinOptions, STATS_OPTIONS } from 'modules/stats/constants';

@Injectable()
export class KitsService {
  constructor(
    @InjectModel(Kit.name) private kitModel: Model<KitDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @Inject(forwardRef(() => StatsService))
    private readonly statsService: StatsService,
  ) {}

  async createKit(kit: CreateAndUpdateKitDto) {
    const newKit = {
      fillingSuccess: 0,
      chats: [],
      ...kit,
    };

    return new this.kitModel(newKit).save();
  }

  async getKits() {
    return await this.kitModel.find().exec();
  }

  async getOneKit(kitId: string) {
    return this.kitModel.findById(kitId).exec();
  }

  async deleteKit(kitId: string) {
    return this.kitModel.findByIdAndDelete(kitId).exec();
  }

  async updateKit(kitId: string, kit: CreateAndUpdateKitDto) {
    const updatedKit = await this.kitModel.findByIdAndUpdate(kitId, kit, {
      new: true,
      useFindAndModify: false,
    });

    if (!updatedKit) {
      return;
    }

    const chats = await this.chatModel.find({
      'kit.id': kitId,
    });
    for (const chat of chats) {
      const promise = (option) =>
        this.statsService.getClientStatForCurrentDay(
          chat.clientNumber,
          STATS_OPTIONS[option].model,
        );

      const newFillingSuccess = await getUpdatedFillingSuccessByChat(
        updatedKit,
        chat,
        promise,
      );

      await this.chatModel.findOneAndUpdate(
        { _id: chat._id },
        {
          $set: {
            'kit.fillingSuccess': newFillingSuccess,
          },
        },
        { new: true, useFindAndModify: false },
      );
    }
    return updatedKit;
  }

  async assignChatsToKit(kitId: string, { chats }: AssignChatsToKitDto) {
    try {
      const kit = await this.kitModel.findById(kitId).exec();

      if (!kit) {
        return;
      }
      const existingChatsInKit = kit.chats.map(({ id }) => id);
      const checkExistingChats = chats.some(({ id }) =>
        existingChatsInKit.includes(id),
      );

      if (checkExistingChats) {
        return;
      }

      for (const newChat of chats) {
        const chat = await this.chatModel.findOne({ _id: newChat.id }).exec();

        if (chat.kit?.id) {
          const oldKit = await this.kitModel.findById(chat.kit.id).exec();

          const filteredChats = oldKit.chats.filter(
            (item) => item.id !== chat.id,
          );

          await this.kitModel.findByIdAndUpdate(
            oldKit.id,
            {
              chats: filteredChats,
            },
            {
              new: true,
              useFindAndModify: false,
            },
          );
        }

        const promise = (option) =>
          this.statsService.getClientStatForCurrentDay(
            chat.clientNumber,
            STATS_OPTIONS[option].model,
          );

        const newFillingSuccess = await getUpdatedFillingSuccessByChat(
          kit,
          chat,
          promise,
        );

        await this.chatModel
          .findByIdAndUpdate(
            newChat.id,
            {
              kit: {
                id: kitId,
                fillingSuccess: newFillingSuccess,
              },
            },
            { new: true, useFindAndModify: false },
          )
          .exec();
      }

      const newChats = chats.map((chat) => ({ ...chat, fillingSuccess: 0 }));
      const combineOldAndNewChats = [...kit.chats, ...newChats];

      return this.kitModel.findByIdAndUpdate(
        kitId,
        {
          chats: combineOldAndNewChats,
        },
        {
          new: true,
          useFindAndModify: false,
        },
      );
    } catch (error) {
      return error ? error : assignChatToKitStatError();
    }
  }

  async getKitCheckins(kitId: string) {
    const kit = await this.kitModel.findById(kitId).exec();

    if (kit) {
      const { name, checkins } = kit;
      const formattedCheckins = checkins.map((checkin) => ({
        ...checkin,
        options: checkin.options.map((option) => STATS_OPTIONS[option]),
      }));

      return {
        name,
        checkins: formattedCheckins,
      };
    }

    return null;
  }

  async updateFillingSuccess(
    chatId: string,
    date: string,
    action: EStatAction,
  ) {
    const chat = await this.chatModel.findOne({ _id: chatId });

    if (!chat) {
      return;
    }

    const { fillingSuccess } = chat.kit;

    const kit = await this.kitModel.findOne({
      chats: {
        $elemMatch: {
          id: chatId,
        },
      },
    });

    if (!kit) {
      return;
    }

    const optionsCheckinsLength = countLengthByOptionsCheckins(
      kit.checkins,
      chat,
    );

    const index = fillingSuccess.findIndex((item) => item.date === date);

    if (index >= 0) {
      fillingSuccess[index].value += action;
      if (fillingSuccess[index].date === date)
        fillingSuccess[index].total = optionsCheckinsLength;
      if (fillingSuccess[index].value > fillingSuccess[index].total)
        fillingSuccess[index].value = fillingSuccess[index].total;
      if (fillingSuccess[index].value < 0) fillingSuccess[index].value = 0;
    } else
      fillingSuccess.push({
        date,
        value: 1,
        total: optionsCheckinsLength,
      });

    if (fillingSuccess.length > 90) fillingSuccess.shift();

    const updatedChat = await this.chatModel.findOneAndUpdate(
      { _id: chatId },
      {
        $set: {
          'kit.fillingSuccess': [...fillingSuccess],
        },
      },
      { new: true, useFindAndModify: false },
    );

    if (!updatedChat) {
      return;
    }

    const newFillingSuccess = updatedChat.kit.fillingSuccess;

    const newChatFillingSuccess =
      newFillingSuccess.reduce(
        (acc, cur) => acc + (cur.value * 100) / cur.total,
        0,
      ) / newFillingSuccess.length;

    const filteredTrackingChats = [];

    for (const chat of kit.chats) {
      const activeChat = await this.chatModel.findOne({
        _id: chat.id,
        active: true,
      });

      if (!!activeChat) filteredTrackingChats.push(chat);
    }

    const newKitFillingSuccess =
      filteredTrackingChats
        .map((chat) => {
          if (chat.id === chatId) {
            return newChatFillingSuccess;
          }
          return chat.fillingSuccess;
        })
        .reduce((acc, cur) => acc + cur, 0) / filteredTrackingChats.length;

    const updatedKit = await this.kitModel.findOneAndUpdate(
      {
        _id: kit._id,
        'chats.id': chatId,
      },
      {
        $set: {
          'chats.$.fillingSuccess': +newChatFillingSuccess.toFixed(),
          fillingSuccess: +newKitFillingSuccess.toFixed(),
        },
      },
      { new: true, useFindAndModify: false },
    );

    if (!updatedKit) {
      return;
    }

    return newFillingSuccess;
  }

  async deleteChatFromKit(kitId: string, id) {
    const kit = await this.getOneKit(kitId);
    const chats = kit.chats.filter((chat) => id.toString() !== chat.id);
    return this.kitModel.findByIdAndUpdate(
      kitId,
      {
        chats,
      },
      {
        new: true,
        useFindAndModify: false,
      },
    );
  }

  async findMatchChatKitOptionsByClient(
    chatId: string,
    option: EAllowedCheckinOptions,
  ) {
    const chat = await this.chatModel.findOne({ _id: chatId });
    const secondChat = await this.chatModel.findOne({
      shortKey: chat.twinChatKey,
    });

    const kit = await this.kitModel.findOne({
      chats: {
        $elemMatch: {
          id: chatId,
        },
      },
    });

    const secondKit = await this.kitModel.findOne({
      chats: {
        $elemMatch: {
          id: secondChat.id,
        },
      },
    });

    if (!kit || !secondKit) {
      return { isMatch: false };
    }

    return {
      isMatch:
        kit.checkins.some((checkin) => checkin.options.includes(option)) &&
        secondKit.checkins.some((checkin) => checkin.options.includes(option)),
      twinChatId: secondChat.id,
    };
  }
}
