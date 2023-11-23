import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './interfaces/message.interface';
import { Sms, SmsDocument } from 'modules/operator/models/sms.model';
import { CreateSmsDto } from 'modules/operator/dto/create-sms.dto';
import { UpdateTemplateDto } from '../operator/dto/update-template.dto';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Sms.name) private smsModel: Model<SmsDocument>,
  ) {}

  async createSms(sms: CreateSmsDto) {
    const createdSms = new this.smsModel(sms);
    return createdSms.save();
  }

  async getSms(operatorId: string) {
    return this.smsModel.find({ operatorId }).exec();
  }

  async getAllSms() {
    return this.smsModel.find({}).exec();
  }

  async deleteSms(id: string) {
    return this.smsModel.findByIdAndDelete(id).exec();
  }

  async findMessageById(id: string) {
    return this.smsModel.findById(id).exec();
  }

  async editTemplate({ id, name, text }: UpdateTemplateDto) {
    return this.smsModel.findByIdAndUpdate(
      id,
      { name, text },
      { new: true, useFindAndModify: false },
    );
  }

  sendSMS(message: Message): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const messagebird = require('messagebird')(
      this.configService.get<string>('mb.key'),
    );
    const mbParams = {
      originator: '+12264577613',
      recipients: [message.to],
      body: message.body,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    messagebird.messages.create(mbParams, (err: string, _response: Message) => {
      if (err) {
        throw new InternalServerErrorException();
      }
    });
  }
}
