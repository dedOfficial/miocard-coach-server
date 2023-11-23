import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateCheckinDto } from './dto/create-checkin.dto';
import { Checkin, CheckinDocument } from './models/checkin.model';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
  ) {}

  async createCheckin(createCheckinDto: CreateCheckinDto) {
    const createCheckin = new this.checkinModel(createCheckinDto);

    return createCheckin.save();
  }

  async getCheckins(chatId: CreateCheckinDto['chatId']) {
    return this.checkinModel.find({ chatId }).exec();
  }

  async findByIdAndUpdate(_id: string, dto: CreateCheckinDto) {
    return await this.checkinModel
      .findByIdAndUpdate(_id, dto, { new: true, useFindAndModify: false })
      .exec();
  }
}
