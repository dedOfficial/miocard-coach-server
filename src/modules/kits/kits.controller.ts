import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';

import {
  AssignChatsToKitDto,
  CreateAndUpdateKitDto,
} from './dto/create-kit.dto';
import { KitsService } from './kits.service';

@Controller('kits')
export class KitsController {
  constructor(private readonly kitsService: KitsService) {}

  @UseGuards(new JwtAuthGuard())
  @Post()
  @UsePipes(new ValidationPipe())
  createKit(@Body() kit: CreateAndUpdateKitDto) {
    return this.kitsService.createKit(kit);
  }

  @UseGuards(new JwtAuthGuard())
  @Get()
  async getKits() {
    const kits = await this.kitsService.getKits();

    if (!kits.length) {
      throw new NotFoundException('Kits not found');
    }

    return kits;
  }

  @UseGuards(new JwtAuthGuard())
  @Get(':kitId')
  async getOneKit(@Param('kitId') kitId: string) {
    const kit = await this.kitsService.getOneKit(kitId);

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    const { chats } = kit;

    return { ...kit.toObject(), chats };
  }

  @UsePipes(new ValidationPipe())
  @Delete(':kitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKit(@Param('kitId') kitId: string) {
    try {
      const kit = await this.kitsService.getOneKit(kitId);

      if (!kit || kit.chats.length) {
        throw new Error();
      }

      return this.kitsService.deleteKit(kitId);
    } catch (_error) {
      throw new HttpException(
        'There are chats attached to the current Kit or Kit was not found!',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  @UseGuards(new JwtAuthGuard())
  @Patch(':kitId')
  @UsePipes(new ValidationPipe())
  async updateKit(
    @Param('kitId') kitId: string,
    @Body() kit: CreateAndUpdateKitDto,
  ) {
    const updatedKit = await this.kitsService.updateKit(kitId, kit);

    if (!updatedKit) {
      throw new NotFoundException('Kit not found');
    }

    return updatedKit;
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('assign/:kitId')
  @UsePipes(new ValidationPipe())
  async assignChatsToKit(
    @Param('kitId') kitId: string,
    @Body() kit: AssignChatsToKitDto,
  ) {
    const updatedKit = await this.kitsService.assignChatsToKit(kitId, kit);

    if (!updatedKit) {
      throw new NotFoundException(
        'Kit not found or you are trying to add already existing chat',
      );
    }

    return updatedKit;
  }

  @UseGuards(new JwtAuthGuard())
  @Get('chat/:kitId')
  async getKitCheckins(@Param('kitId') kitId: string) {
    const kitCheckins = await this.kitsService.getKitCheckins(kitId);

    if (!kitCheckins) {
      throw new NotFoundException('KitCheckins not found');
    }

    return kitCheckins;
  }
}
