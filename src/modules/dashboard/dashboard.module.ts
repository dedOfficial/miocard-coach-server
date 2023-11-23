import { Module } from '@nestjs/common';

import { OperatorModule } from 'modules/operator/operator.module';
import { StatsModule } from 'modules/stats/stats.module';
import { TrackedParametersModule } from 'modules/trackedParameters/trackedParameters.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [OperatorModule, StatsModule, TrackedParametersModule],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
