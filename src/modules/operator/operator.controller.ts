import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Patch,
  NotFoundException,
  Req,
  UsePipes,
  ValidationPipe,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import omit = require('lodash/omit');
import unset = require('lodash/unset');
import mergeWith = require('lodash/mergeWith');
import get = require('lodash/get');
import set = require('lodash/set');

import { MessageService } from 'modules/message/message.service';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { ChatService } from 'modules/chat/chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateChatDto, UpdateChatStatusDto } from './dto/update-chat.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { OperatorService } from './operator.service';
import { TrackedParametersService } from '../trackedParameters/trackedParameters.service';

import { Role } from './decorators/guard/role.enum';
import { Roles } from 'modules/operator/decorators/guard/roles.decorator';
import { RolesGuard } from 'modules/operator/decorators/guard/roles.guard';
import {
  argumentsToSetPlannedCheckins,
  checkEqualPlannedCheckins,
} from './helpers';

@Controller('operator')
export class OperatorController {
  private readonly logger = new Logger(OperatorController.name);

  constructor(
    private readonly operatorService: OperatorService,
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly trackedParametersService: TrackedParametersService,
    private readonly configService: ConfigService,
  ) {}

  // Operators & assistants controllers
  @UseGuards(new JwtAuthGuard())
  @Get('coaches')
  getAllCoaches() {
    return this.operatorService.getAllCoaches();
  }

  @UseGuards(new JwtAuthGuard())
  @Get('assistants')
  getAllAssistants() {
    return this.operatorService.getAllAssistants();
  }

  @UseGuards(new JwtAuthGuard())
  @Post()
  @UsePipes(new ValidationPipe())
  async createOperator(@Body() createOperatorDto: CreateOperatorDto) {
    return this.operatorService.createOperator(createOperatorDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete()
  deleteOperator(@Body('email') email: string) {
    return this.operatorService.deleteOperator(email);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch()
  @UsePipes(new ValidationPipe())
  updateOperator(@Body() updateOperatorDto: UpdateOperatorDto) {
    return this.operatorService.updateOperator(updateOperatorDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('avatar')
  addAvatar(@Body('id') id: string) {
    return this.operatorService.addAvatar(id);
  }

  // Chat controllers
  @UseGuards(new JwtAuthGuard())
  @Post('chat')
  @UsePipes(new ValidationPipe())
  newChat(@Body() createChatDto: CreateChatDto) {
    return this.operatorService.createChat(createChatDto);
  }

  @Roles(Role.Admin)
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @UsePipes(new ValidationPipe())
  @Delete('chat')
  async deleteChat(@Body('id') chatId: string) {
    return this.operatorService.deleteChat(chatId);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('chat')
  @UsePipes(new ValidationPipe())
  async patchChat(@Body() updateChatDto: UpdateChatDto) {
    try {
      const chat = await this.operatorService.findChatById(updateChatDto.id);
      const secondChat = await this.operatorService.findChatByKey(
        chat.twinChatKey,
      );

      if (!checkEqualPlannedCheckins(chat, updateChatDto))
        await this.trackedParametersService.setPlannedCheckin(
          argumentsToSetPlannedCheckins(chat, updateChatDto),
        );

      if (!checkEqualPlannedCheckins(secondChat, updateChatDto))
        await this.trackedParametersService.setPlannedCheckin(
          argumentsToSetPlannedCheckins(secondChat, updateChatDto),
        );

      unset(updateChatDto, 'selfEfficacy.previous');
      const isSelfEfficacy = updateChatDto.selfEfficacy;
      if (isSelfEfficacy) {
        // If you changed the structure of the Chat Model, then correct the path to editing selfEfficacy
        const currentSelfEfficacyValue = get(chat, 'selfEfficacy.current');
        set(updateChatDto, 'selfEfficacy.previous', currentSelfEfficacyValue);
      }

      const newChat = mergeWith(
        chat,
        omit(updateChatDto, 'id'),
        (prevValue, newValue) => {
          if (
            Array.isArray(newValue) ||
            typeof newValue === 'number' ||
            typeof newValue === 'string' ||
            typeof newValue === 'boolean'
          ) {
            return newValue;
          }

          return { ...prevValue, ...newValue };
        },
      );

      unset(updateChatDto, 'selfEfficacy.previous');

      const newSecondChat = mergeWith(
        secondChat,
        omit(updateChatDto, 'id'),
        (prevValue, newValue) => {
          if (
            Array.isArray(newValue) ||
            typeof newValue === 'number' ||
            typeof newValue === 'string' ||
            typeof newValue === 'boolean'
          ) {
            return newValue;
          }

          return { ...prevValue, ...newValue };
        },
      );

      const updatedChat = await this.operatorService.findByIdAndUpdate(
        updateChatDto.id,
        newChat,
      );

      const updatedSecondChat = await this.operatorService.findByIdAndUpdate(
        secondChat.id,
        newSecondChat,
      );

      if (!updatedChat || !updatedSecondChat) {
        throw new Error();
      }

      return updatedChat;
    } catch (error) {
      throw new NotFoundException();
    }
  }

  @Roles(Role.Admin)
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @UsePipes(new ValidationPipe())
  @Patch('chat/status')
  async updateChatStatus(@Body() updateChatStatusDto: UpdateChatStatusDto) {
    try {
      const chat = await this.operatorService.findChatById(
        updateChatStatusDto.id,
      );

      if (!chat) {
        throw 'Chat not found';
      }

      const secondChat = await this.operatorService.findChatByKey(
        chat.twinChatKey,
      );

      const updatedChat = await this.operatorService.findByIdAndUpdateChatStatus(
        updateChatStatusDto,
      );

      const updatedSecondChat = await this.operatorService.findByIdAndUpdateChatStatus(
        { id: secondChat.id, active: updateChatStatusDto.active },
      );

      if (!updatedChat || !updatedSecondChat) {
        throw 'Chat has not been updated';
      }

      return updatedChat;
    } catch (error) {
      throw new HttpException(error, HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chats/:operatorId')
  getChats(@Param('operatorId') operatorId: string) {
    return this.operatorService.findAllChatsByCoachOrAssistantId(operatorId);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chat/check/:phone')
  @UsePipes(new ValidationPipe())
  checkingForAnExistingNumber(@Param('phone') phone: string) {
    return this.operatorService.findChatByClientNumber(phone);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chats')
  getAllChats() {
    return this.operatorService.getAllChatsWithUnreadMessages();
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chat/get_id')
  getChatId(@Req() req: Request) {
    return this.operatorService.getChatId(req.user['phone']);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chat_info/:id')
  getChatInfo(@Param('id') chatId: string) {
    return this.operatorService.getChatInfo(chatId);
  }

  @Get('info/:id')
  getPublicInfo(@Param('id') chatId: string) {
    return this.operatorService.getPublicInfo(chatId);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chat/:id')
  getChatHistory(@Param('id') id: string) {
    return this.operatorService.getChatHistory(id);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chat_messages/:id')
  getInitialChatHistory(@Param('id') id: string) {
    return this.operatorService.getInitialChatHistory(id);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chat_messages/:id/:count')
  getPartOfChatHistory(@Param('id') id: string, @Param('count') count: string) {
    return this.operatorService.getPartOfChatHistory(id, count);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chat_messages_web/:id/:count')
  getChatHistoryPartly(@Param('id') id: string, @Param('count') count: string) {
    return this.operatorService.getChatHistoryPartly(id, count);
  }

  @UseGuards(new JwtAuthGuard())
  @Post('chat/message')
  newChatMessage(@Body() createChatMessageDto: CreateChatMessageDto) {
    return this.chatService.createMessage(createChatMessageDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Post('sms')
  async resendSMS(
    @Body('chatId') chatId: string,
    @Body('templateId') messageId: string,
  ) {
    const message = await this.messageService.findMessageById(messageId);
    const chat = await this.operatorService.findChatById(chatId);
    const url = this.configService.get<string>('url');
    const textToSend = message.text
      .replace('#htn_link', `${url}/download`)
      .replace('#htn_id', `${url}/chat/${chat.shortKey}`);
    this.logger.verbose(`Sent SMS to ${chat.clientNumber}: ${textToSend}`);

    return this.messageService.sendSMS({
      body: textToSend,
      to: chat.clientNumber,
    });
  }
}
