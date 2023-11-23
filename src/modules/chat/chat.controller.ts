import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { OperatorService } from 'modules/operator/operator.service';
import { StatsService } from 'modules/stats/stats.service';
import { ChatService } from './chat.service';
import {
  AssignOperatorToChatsDto,
  DeleteOperatorFromChatsDto,
} from './dto/chat.dto';
import { assignOperatorToChat } from './helpers';
import { OperatorForChat } from '../operator/enums/operators-for-chat.enum';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly operatorService: OperatorService,
    private readonly statsService: StatsService,
  ) {}

  @UseGuards(new JwtAuthGuard())
  @Post('message')
  newChatMessage(@Body('chatId') chatId: string, @Body('body') body: string) {
    return this.chatService.createMessage({
      chatId,
      body,
      fromOperator: false,
      fromDoctor: false,
    });
  }

  @UseGuards(new JwtAuthGuard())
  @Post('mark_seen')
  markMessagesSeenForChat(@Body('shortKey') shortKey: string) {
    return this.chatService.setMessagesSeenForChat(shortKey);
  }

  @UseGuards(new JwtAuthGuard())
  @Post('last_message')
  lastChatMessage(@Body('chatId') chatId: string) {
    return this.chatService.getLastMessage(chatId);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('todays_measurements')
  async getChatsTodaysMeasurements() {
    const chats = await this.operatorService.getAllChats();

    if (!chats.length) {
      throw new NotFoundException('Chats not found');
    }

    return Promise.all(
      chats.map(async (chat) => {
        const { clientNumber, dummyName, shortKey } = chat;
        const stat = await this.statsService.findTodaysMeasurement(
          clientNumber,
        );

        if (stat) {
          return {
            shortKey,
            dummyName,
            measurement: true,
          };
        }

        return {
          shortKey,
          dummyName,
          measurement: false,
        };
      }),
    )
      .then((chats) => {
        return chats;
      })
      .catch(() => {
        throw new NotFoundException();
      });
  }

  @UseGuards(new JwtAuthGuard())
  @Get('filter')
  async getFilteredChats(
    @Query('chat_name') chatName: string,
    @Query('date') date: string,
  ) {
    try {
      const filteredChats = await this.chatService.getFilteredChats(
        chatName,
        date,
      );

      return Promise.all(
        filteredChats.map(async (chat) => {
          const { _id, operatorId, assistantId, dummyName, type } = chat;

          const findOperator = async (id: string) => {
            const operator = await this.operatorService.findOperatorById(id);

            if (!operator)
              return {
                _id,
                type,
                dummyName,
              };

            return {
              _id,
              type,
              dummyName,
              assigned: { _id: operator._id, name: operator.name },
            };
          };

          if (operatorId.length && type === OperatorForChat.COACH) {
            return findOperator(operatorId);
          } else if (assistantId.length && type === OperatorForChat.ASSISTANT) {
            return findOperator(assistantId);
          }

          return {
            _id,
            type,
            dummyName,
          };
        }),
      )
        .then((chats) => {
          return chats;
        })
        .catch(() => {
          throw new NotFoundException();
        });
    } catch (error) {
      throw new NotFoundException();
    }
  }

  @UseGuards(new JwtAuthGuard())
  @Get(':operatorId')
  async getChatsByOperatorId(@Param('operatorId') operatorId: string) {
    const operator = await this.operatorService.findOperatorWithSelect(
      operatorId,
    );

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const assignedChats = await this.chatService.findAllChatsByOperatorIdWithSelect(
      operatorId,
    );

    return {
      ...operator.toObject(),
      assignedChats,
    };
  }

  @UseGuards(new JwtAuthGuard())
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOperatorIdFromChat(@Body() body: DeleteOperatorFromChatsDto) {
    try {
      const chat = await this.operatorService.findChatById(body.chatId);
      const secondChat = await this.operatorService.findChatByKey(
        chat.twinChatKey,
      );
      const deletedChat = await this.chatService.updateOperatorIdInChat(
        body.chatId,
        body.type,
      );

      const deletedTwinChat = await this.chatService.updateOperatorIdInChat(
        secondChat._id,
        body.type,
      );
      if (!deletedChat || !deletedTwinChat) {
        throw new Error();
      }
    } catch (_error) {
      throw new ForbiddenException('Operator-id has not been deleted');
    }
  }

  @UseGuards(new JwtAuthGuard())
  @Patch()
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignOperatorToChats(@Body() body: AssignOperatorToChatsDto) {
    try {
      const { chats, operatorId } = body;
      const operator = await this.operatorService.findOperatorById(operatorId);

      if (!operator) {
        throw new Error();
      }

      const chatsWithTwin = [];

      for (const chatId of chats) {
        const chat = await this.operatorService.findChatById(chatId);
        const secondChat = await this.operatorService.findChatByKey(
          chat.twinChatKey,
        );
        chatsWithTwin.push(chat._id, secondChat._id);
      }

      const requests = chatsWithTwin.map((chatId) =>
        this.chatService.updateOperatorIdInChat(
          chatId,
          operator.type,
          operatorId,
        ),
      );

      const assignedChats = await assignOperatorToChat(requests);

      if (!assignedChats) {
        throw new Error();
      }
    } catch (_error) {
      throw new ForbiddenException(
        'The operator does not exist or one of the chats was not found',
      );
    }
  }
}
