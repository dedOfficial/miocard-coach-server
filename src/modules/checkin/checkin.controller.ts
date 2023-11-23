import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import omit = require('lodash/omit');

import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { OperatorService } from 'modules/operator/operator.service';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Controller('checkin')
export class CheckinController {
  constructor(
    private readonly checkinService: CheckinService,
    private readonly operatorService: OperatorService,
  ) {}

  @UseGuards(new JwtAuthGuard())
  @Post()
  @UsePipes(new ValidationPipe())
  async createCheckin(
    @Body()
    createCheckinDto: CreateCheckinDto,
  ) {
    const checkingExistingChat = await this.operatorService.getChatInfo(
      createCheckinDto.chatId,
    );

    if (!checkingExistingChat) {
      throw new NotFoundException('Chat not found');
    }

    return this.checkinService.createCheckin(createCheckinDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch()
  @UsePipes(new ValidationPipe())
  async updateCheckin(
    @Body()
    createCheckinDto: CreateCheckinDto & { _id: string },
  ) {
    const checkingExistingChat = await this.operatorService.getChatInfo(
      createCheckinDto.chatId,
    );

    if (!checkingExistingChat) {
      throw new NotFoundException('Chat not found');
    }

    const updatedCheckin = await this.checkinService.findByIdAndUpdate(
      createCheckinDto._id,
      omit(createCheckinDto, ['_id', 'chatId', 'checkinNumber']),
    );

    if (!updatedCheckin) {
      throw new NotFoundException();
    }

    return updatedCheckin;
  }

  @UseGuards(new JwtAuthGuard())
  @Get(':id')
  async getCheckins(@Param('id') chatId: CreateCheckinDto['chatId']) {
    const checkingExistingChat = await this.operatorService.getChatInfo(chatId);

    if (!checkingExistingChat) {
      throw new NotFoundException('Chat not found');
    }

    return this.checkinService.getCheckins(chatId);
  }
}
