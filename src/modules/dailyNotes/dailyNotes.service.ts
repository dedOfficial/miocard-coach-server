import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AddDailyNoteDto, GetDailyNotesDto } from './dto/daily-notes.dto';
import { DailyNotes, DailyNotesDocument } from './models/dailyNotes.model';
import { getTimeForFilteringDailyNotes } from './helpers';

@Injectable()
export class DailyNotesService {
  constructor(
    @InjectModel(DailyNotes.name)
    private dailyNotesModel: Model<DailyNotesDocument>,
  ) {}

  addDailyNote(addDailyNote: AddDailyNoteDto) {
    return new this.dailyNotesModel(addDailyNote).save();
  }

  getDailyNotes({ clientNumber }: GetDailyNotesDto) {
    return this.dailyNotesModel.find({ clientNumber }).exec();
  }

  getFilteredDailyNotes(clientNumber, date) {
    const { start, end } = getTimeForFilteringDailyNotes(date);

    return this.dailyNotesModel
      .find({
        clientNumber,
        createdAt: {
          $gte: start,
          $lte: end,
        },
      })
      .exec();
  }
}
