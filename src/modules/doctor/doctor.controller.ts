import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageService } from '../message/message.service';
import { OperatorService } from '../operator/operator.service';
import { DoctorService } from './doctor.service';
import { CallDotctorDto } from './dto/call-doctor.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { DeleteDoctorDto } from './dto/delete-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Controller('doctor')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly operatorService: OperatorService,
    private readonly messageService: MessageService,
  ) {}

  @UseGuards(new JwtAuthGuard())
  @Post()
  async addDoctor(@Body() createDoctorDto: CreateDoctorDto) {
    await this.operatorService.createOperator({
      email: createDoctorDto.email,
      name: createDoctorDto.name,
    });
    return this.doctorService.addDoctor(createDoctorDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Delete()
  removeDoctor(@Body() deleteDoctorDto: DeleteDoctorDto) {
    return this.doctorService.removeDoctor(deleteDoctorDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch('avatar')
  async addAvatar(@Body('id') id: string) {
    return this.doctorService.addAvatar(id);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch()
  updateDoctor(@Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorService.updateDoctor(updateDoctorDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Get()
  allDoctors() {
    return this.doctorService.listDoctors();
  }

  @UseGuards(new JwtAuthGuard())
  @Get(':id')
  async getDoctor(@Param('id') id: string) {
    const doctor = await this.doctorService.getDoctor(id);
    if (!doctor) throw new NotFoundException();
    return doctor;
  }

  @UseGuards(new JwtAuthGuard())
  @Post('call')
  async callDoctor(@Body() callDoctorDto: CallDotctorDto) {
    const doctor = await this.doctorService.getDoctor(callDoctorDto.doctorId);
    if (!doctor) throw new NotFoundException();
    this.messageService.sendSMS({
      body: `Hi ${doctor.name}, coach needs your assistance: https://htn.ai/doctor/chat/${callDoctorDto.chatId}`,
      to: doctor.number,
    });
  }
}
