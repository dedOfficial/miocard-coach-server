import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskService } from './task.service';

@UseGuards(new JwtAuthGuard())
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UsePipes(new ValidationPipe())
  @Post()
  addTask(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.insertTask(createTaskDto);
  }

  @UsePipes(new ValidationPipe())
  @Get(':operatorId')
  getTasks(@Param('operatorId') operatorId: string) {
    return this.taskService.getTasks(operatorId);
  }

  @UsePipes(new ValidationPipe())
  @Get()
  getAllTasks() {
    return this.taskService.getAllTasks();
  }

  @UsePipes(new ValidationPipe())
  @Delete()
  deleteTask(@Body('taskId') taskId: string) {
    return this.taskService.deleteTask(taskId);
  }
}
