import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { CreateSmsDto } from 'modules/operator/dto/create-sms.dto';
import { UpdateTemplateDto } from '../operator/dto/update-template.dto';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(new JwtAuthGuard())
  @Post()
  createTemplate(@Body() createSms: CreateSmsDto) {
    return this.messageService.createSms(createSms);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch()
  updateTemplate(@Body() updateTemplate: UpdateTemplateDto) {
    return this.messageService.editTemplate(updateTemplate);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('messages/:operatorId')
  getTemplates(@Param('operatorId') operatorId: string) {
    return this.messageService.getSms(operatorId);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('messages/')
  getAlltemplates() {
    return this.messageService.getAllSms();
  }

  @UseGuards(new JwtAuthGuard())
  @Delete()
  deleteTemplate(@Body('id') id: string) {
    return this.messageService.deleteSms(id);
  }
}
