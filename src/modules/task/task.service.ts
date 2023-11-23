import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task, TaskDocument } from './models/task.model';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async insertTask(createTaskDto: CreateTaskDto) {
    const newTask = new this.taskModel(createTaskDto);
    this.logger.log(`New task: ${newTask}`);
    return await newTask.save();
  }

  getAllTasks() {
    return this.taskModel.find({}).exec();
  }

  deleteTask(id: string) {
    return this.taskModel.findByIdAndDelete(id).exec();
  }

  getTasks(operatorId: string) {
    const objectId = Types.ObjectId(operatorId);
    return this.taskModel.find({ operatorId: objectId });
  }
}
