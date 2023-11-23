import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { OperatorService } from 'modules/operator/operator.service';
import { DailyNotesService } from './dailyNotes.service';
import { AddDailyNoteDto } from './dto/daily-notes.dto';

@Controller('daily-notes')
export class DailyNotesController {
  constructor(
    private readonly dailyNotesService: DailyNotesService,
    private readonly operatorService: OperatorService,
  ) {}

  @Post()
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  async addDailyNote(@Body() addDailyNote: AddDailyNoteDto) {
    try {
      const note = await this.dailyNotesService.addDailyNote(addDailyNote);

      if (!note) {
        throw 'Error creating daily note';
      }

      return note;
    } catch (error) {
      throw new HttpException(error, HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(new JwtAuthGuard())
  @Get()
  async getDailyNotesByDate(
    @Query('clientNumber') clientNumber: string,
    @Query('date') date: string,
  ) {
    const adjustedClientNumber = clientNumber.replace(/ /, '+');

    try {
      const chats = await this.operatorService.findChatByClientNumber(
        adjustedClientNumber,
      );

      if (!chats.length) {
        throw `No chats found for this phone number ${clientNumber}`;
      }

      const { operatorId, assistantId } = chats[0];

      const operator = operatorId.length
        ? await this.operatorService.findOperatorById(operatorId)
        : { name: null, avatar: null };

      const assistant = assistantId.length
        ? await this.operatorService.findOperatorById(assistantId)
        : { name: null, avatar: null };

      const notes = !date.length
        ? await this.dailyNotesService.getDailyNotes({
            clientNumber: adjustedClientNumber,
          })
        : await this.dailyNotesService.getFilteredDailyNotes(
            adjustedClientNumber,
            date,
          );

      return {
        users: {
          operator: {
            name: operator.name,
            avatar: operator.avatar,
          },
          assistant: {
            name: assistant.name,
            avatar: assistant.avatar,
          },
        },
        notes,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.FORBIDDEN);
    }
  }
}
