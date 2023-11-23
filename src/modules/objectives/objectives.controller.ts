import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ObjectivesService } from './objectives.service';
import {
  CreateObjectiveDto,
  DeleteObjectiveDto,
  GetObjectiveDto,
  GetObjectiveStatByKeyResultDto,
  UpdateObjectiveDto,
} from './dto/objectives.dto';
import { OperatorService } from 'modules/operator/operator.service';
import { StatsService } from 'modules/stats/stats.service';
import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import { countCommonValueForEachStat } from './helpers';

@Controller('objectives')
export class ObjectivesController {
  constructor(
    private readonly objectivesService: ObjectivesService,
    private readonly operatorService: OperatorService,
    private readonly statsService: StatsService,
  ) {}

  @Get()
  @UseGuards(new JwtAuthGuard())
  async getObjectives() {
    const objectives = await this.objectivesService.getObjectives();

    // TODO count achievement
    const objectivesWithAchievement = objectives.map((objective) => ({
      ...objective,
      achievement: 0,
    }));

    return objectivesWithAchievement;
  }

  @Post()
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  createObjective(@Body() objective: CreateObjectiveDto) {
    try {
      return this.objectivesService.createObjective(objective);
    } catch (_error) {
      throw new NotFoundException(
        'Something went wrong while creating objective',
      );
    }
  }

  @Patch()
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  updateObjective(@Body() newObjective: UpdateObjectiveDto) {
    try {
      return this.objectivesService.updateObjective(newObjective);
    } catch (_error) {
      throw new NotFoundException(
        'Something went wrong while updating objective',
      );
    }
  }

  @Delete()
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOperatorIdFromChat(@Body() deleteObjective: DeleteObjectiveDto) {
    try {
      const { deletedCount } = await this.objectivesService.deleteObjective(
        deleteObjective,
      );

      if (!deletedCount) {
        throw new Error();
      }
    } catch (_error) {
      throw new ForbiddenException('Objective has not been deleted');
    }
  }

  @Get('/:objectiveId/')
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  async getObjective(@Param() params: GetObjectiveDto) {
    const objective = await this.objectivesService.getObjective(params);

    // TODO count Objective achievement by coaches
    // TODO count Key results achievement

    return objective;
  }

  @Get('/key-results-achievement/:objectiveId/')
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  async getAllKeyResultsAchievementByObjective(
    @Param() params: GetObjectiveDto,
  ) {
    try {
      const objective = await this.objectivesService.getObjective(params);

      if (!objective) {
        throw new Error('Objective not found');
      }

      const { keyResults } = objective;

      const returnDataRequest = keyResults.map(async (keyResult) =>
        Promise.all(
          await [this.objectivesService.getKeyResultValue(keyResult)],
        ).then((data) => {
          return {
            name: keyResult.name,
            type: countCommonValueForEachStat(data[0]).type,
            data: countCommonValueForEachStat(data[0]).data,
          };
        }),
      );

      return Promise.all(returnDataRequest)
        .then((returnData) => {
          return returnData;
        })
        .catch(() => {
          throw new NotFoundException(
            'Something went wrong while counting all key results by objective',
          );
        });
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('/:objectiveId/:keyResultName')
  @UseGuards(new JwtAuthGuard())
  async getObjectiveStatByKeyResult(
    @Param() params: GetObjectiveStatByKeyResultDto,
  ) {
    try {
      const objective = await this.objectivesService.getObjective(params);

      if (!objective) {
        throw new Error('Objective not found');
      }

      const keyResult = objective.keyResults.find(
        ({ name }) => name === params.keyResultName,
      );

      if (!keyResult) {
        throw new Error('Specified keyResult name not found');
      }

      return this.objectivesService.getKeyResultValue(keyResult);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  // here will be Objective achievement for all Operators
  @Get('/achievement/:objectiveId/')
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  async getObjectiveAchievementByAllOperators() {
    // TODO do it after making /:objectiveId/:keyResultName
    try {
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  // here will be Objective achievement by Operator
  @Get('/achievement/:objectiveId/:operatorId/')
  @UseGuards(new JwtAuthGuard())
  async getObjectiveAchievementByOperator(@Param() params: any) {
    try {
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
