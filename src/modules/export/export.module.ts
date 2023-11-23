import { Module } from '@nestjs/common';

import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { PdfModule } from '../pdf/pdf.module';
import { OperatorModule } from '../operator/operator.module';
import { StatsModule } from '../stats/stats.module';
import { ExcelModule } from 'modules/excel/excel.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'modules/operator/models/chat.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    PdfModule,
    OperatorModule,
    StatsModule,
    ExcelModule,
  ],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
