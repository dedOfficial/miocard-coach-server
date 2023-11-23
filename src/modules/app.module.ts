import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessageModule } from './message/message.module';
import { AuthModule } from './auth/auth.module';
import { OperatorModule } from './operator/operator.module';
import { ChatModule } from './chat/chat.module';
import { StatsModule } from './stats/stats.module';
import { PdfModule } from './pdf/pdf.module';
import { ExportModule } from './export/export.module';
import { DoctorModule } from './doctor/doctor.module';
import dbConfig from '../configs/db.config';
import serverConfig from '../configs/server.config';
import facebookConfig from '../configs/facebook.config';
import smsConfig from '../configs/sms.config';
import { ExcelModule } from 'modules/excel/excel.module';
import { TaskModule } from './task/task.module';
import { FilesModule } from './files/files.module';
import { KitsModule } from 'modules/kits/kits.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TrackedParametersModule } from './trackedParameters/trackedParameters.module';
import { ObjectivesModule } from './objectives/objectives.module';
import { OperatorService } from './operator/operator.service';
import { DailyNotesModule } from './dailyNotes/dailyNotes.module';
import { RolesGuard } from 'modules/operator/decorators/guard/roles.guard';
import { ClientModule } from './client/client.module';
import { ChartsModule } from './charts/charts.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serverConfig, dbConfig, facebookConfig, smsConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo.uri'),
        useCreateIndex: true,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    MessageModule,
    AuthModule,
    OperatorModule,
    ChatModule,
    StatsModule,
    PdfModule,
    ExportModule,
    DoctorModule,
    ExcelModule,
    TaskModule,
    FilesModule,
    KitsModule,
    DashboardModule,
    TrackedParametersModule,
    ObjectivesModule,
    DailyNotesModule,
    ClientModule,
    ChartsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RolesGuard],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly operatorService: OperatorService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.configService.get<string>('admin.email');
    const operatorExists = await this.operatorService.findOperator(email);
    if (!operatorExists.length) {
      this.operatorService.createOperator({
        email: email,
        name: this.configService.get<string>('admin.name'),
        isSuperadmin: true,
      });
    }
  }
}
