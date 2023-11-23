import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { OperatorService } from 'modules/operator/operator.service';
import { StatsService } from 'modules/stats/stats.service';
import {
  CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR,
  EAllowedTrackedParameters,
  PARAMETER_SAVING_ERROR,
  SOMETHING_WENT_WRONG_ERROR,
  TRACKED_PARAMETER_NOT_FOUND_ERROR,
} from './constants';
import {
  GetAllCheckinProblemsByChatDto,
  GetCheckinProblemsByCoachDto,
  GetDataCollectionByChatByAllCoachesDto,
  GetMeasurementsByChatByAllCoachesDto,
  GetPatientReturnByChatByAllCoachesDto,
  TrackedParametersDto,
} from './dto/trackedParameters.dto';
import { countDataCollectionWholeProject } from './helpers';
import { TrackedParametersService } from './trackedParameters.service';
import { TTrackedParameterByCoach } from './helpers/types';
import groupBy = require('lodash/groupBy');

@Controller('tracked_parameters')
export class TrackedParametersController {
  constructor(
    private readonly trackedParametersService: TrackedParametersService,
    private readonly operatorService: OperatorService,
    private readonly statsService: StatsService,
  ) {}

  // Measurements tracked parameter
  //
  @UseGuards(new JwtAuthGuard())
  @Get('measurements')
  async getAllCoaches() {
    const coaches = await this.operatorService.findAllCoaches();
    const assistants = await this.operatorService.findAllAssistants();

    if (!coaches.length) {
      throw new NotFoundException('Operators not found');
    }

    if (!assistants.length) {
      throw new NotFoundException('Assistants not found');
    }

    const trackedParameter = await this.trackedParametersService.findTrackedParameter(
      EAllowedTrackedParameters.BP_MEASUREMENTS_CONTROL,
    );

    if (!trackedParameter) {
      throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
    }

    const minNorm = trackedParameter.value;

    const operators = coaches.concat(assistants);

    const countStatByOperator = operators.map(async ({ _id, name }) => {
      const chats = await this.operatorService.findAllActiveChatsById(_id);

      return await this.trackedParametersService.getAverageMeasurementsByCoach(
        _id,
        name,
        minNorm,
        chats,
      );
    });

    return Promise.all(countStatByOperator)
      .then((data) => {
        // TODO replace mock data (minNorm and percentage)
        return {
          coaches: data.filter((value) => value),
          minNorm,
          percentage: trackedParameter ? trackedParameter.percentage : false,
        };
      })
      .catch(() => {
        throw new NotFoundException(
          SOMETHING_WENT_WRONG_ERROR + 'measurements',
        );
      });
  }

  @UseGuards(new JwtAuthGuard())
  @Get('measurements/:operatorId')
  async getMeasurementsByChatByAllCoaches(
    @Param() { operatorId }: GetMeasurementsByChatByAllCoachesDto,
  ) {
    const chats = await this.operatorService.findAllActiveChatsById(operatorId);

    if (!chats.length) {
      throw new NotFoundException(CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR);
    }
    return this.trackedParametersService.getMeasurementsByCoachChats(chats);
  }

  @Post('measurements/parameter')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.NO_CONTENT)
  async addAndChangeTrackedParameter(@Body() parameter: TrackedParametersDto) {
    try {
      return this.trackedParametersService.createTrackedParameter(parameter);
    } catch (e) {
      throw new HttpException(PARAMETER_SAVING_ERROR, HttpStatus.FORBIDDEN);
    }
  }

  // Check-in problems tracked parameter
  //
  @UseGuards(new JwtAuthGuard())
  @Get('checkin-problems')
  async getCheckinProblemsByAllCoaches() {
    const coaches = await this.operatorService.findAllCoaches();
    const assistants = await this.operatorService.findAllAssistants();

    if (!coaches.length) {
      throw new NotFoundException('Operators not found');
    }

    if (!assistants.length) {
      throw new NotFoundException('Assistants not found');
    }

    const trackedParameter = await this.trackedParametersService.findTrackedParameter(
      EAllowedTrackedParameters.CHECKIN_PROBLEMS,
    );

    if (!trackedParameter) {
      throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
    }

    const operators = coaches.concat(assistants);

    const maxLimit = trackedParameter.value;

    const data = operators.map(async ({ _id, name }) => {
      const chats = await this.operatorService.findAllActiveChatsById(_id);

      return await this.trackedParametersService.getAverageCheckinProblemsByCoach(
        _id,
        name,
        maxLimit,
        chats,
      );
    });

    return Promise.all(data)
      .then((data) => {
        return data;
      })
      .catch(() => {
        throw new NotFoundException(
          SOMETHING_WENT_WRONG_ERROR + 'CheckinProblems',
        );
      });
  }

  @UseGuards(new JwtAuthGuard())
  @Get('checkin-problems/:operatorId')
  async getCheckinProblemsByCoach(
    @Param() { operatorId }: GetCheckinProblemsByCoachDto,
  ) {
    const chats = await this.operatorService.findAllActiveChatsById(operatorId);

    if (!chats.length) {
      throw new NotFoundException(CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR);
    }

    return this.trackedParametersService.getCheckinProblemsByCoachChats(chats);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('checkin-problems/info/:chatId')
  async getAllCheckinProblemsByChat(
    @Param() { chatId }: GetAllCheckinProblemsByChatDto,
  ) {
    const chat = await this.operatorService.findChatById(chatId);

    if (!chat) {
      throw new NotFoundException('Chat not found for current chatId');
    }

    const checkins = await this.statsService.getCheckinsGroupByTime({
      clientNumber: chat.clientNumber,
    });

    return checkins.map((checkin) => ({
      ...checkin,
      checkinsList: groupBy(checkin.checkinsList, 'checkin'),
    }));
  }

  @Post('checkin-problems/parameter')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.NO_CONTENT)
  async addAndChangeCheckinProblemsTrackedParameter(
    @Body() parameter: TrackedParametersDto,
  ) {
    try {
      return this.trackedParametersService.createTrackedParameter(parameter);
    } catch (e) {
      throw new HttpException(PARAMETER_SAVING_ERROR, HttpStatus.FORBIDDEN);
    }
  }

  // Data collection tracked parameter
  //
  @UseGuards(new JwtAuthGuard())
  @Get('data-collection')
  async getDataCollectionByAllCoaches() {
    const coaches = await this.operatorService.findAllCoaches();
    const assistants = await this.operatorService.findAllAssistants();

    if (!coaches.length) {
      throw new NotFoundException('Operators not found');
    }

    if (!assistants.length) {
      throw new NotFoundException('Assistants not found');
    }

    const trackedParameter = await this.trackedParametersService.findTrackedParameter(
      EAllowedTrackedParameters.DATA_COLLECTION,
    );

    if (!trackedParameter) {
      throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
    }

    const minNorm = trackedParameter.value;

    const operators = coaches.concat(assistants);

    const data = operators.map(async ({ _id, name }) => {
      const chats = await this.operatorService.findAllActiveChatsById(_id);

      return await this.trackedParametersService.getAverageDataCollectionByCoach(
        _id,
        name,
        minNorm,
        chats,
      );
    });

    return Promise.all(data)
      .then((data: TTrackedParameterByCoach[]) => {
        return {
          wholeProject: countDataCollectionWholeProject(data, minNorm),
          minNorm,
          coaches: data,
        };
      })
      .catch((error) => {
        throw (
          error ??
          new InternalServerErrorException(
            SOMETHING_WENT_WRONG_ERROR + 'data collection',
          )
        );
      });
  }

  @Post('data-collection/parameter')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.NO_CONTENT)
  async addAndChangeDataCollectionParameter(
    @Body() parameter: TrackedParametersDto,
  ) {
    try {
      return this.trackedParametersService.createTrackedParameter(parameter);
    } catch (e) {
      throw new HttpException(PARAMETER_SAVING_ERROR, HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(new JwtAuthGuard())
  @Get('data-collection/:operatorId')
  async getDataCollectionByCoach(
    @Param() { operatorId }: GetDataCollectionByChatByAllCoachesDto,
  ) {
    const chats = await this.operatorService.findAllActiveChatsById(operatorId);

    if (!chats.length) {
      throw new NotFoundException(CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR);
    }

    return this.trackedParametersService.getDataCollectionByCoachChats(chats);
  }

  // Patient return tracked parameter
  //
  @UseGuards(new JwtAuthGuard())
  @Get('patient-return')
  async getPatientReturnByAllCoaches() {
    const coaches = await this.operatorService.findAllCoaches();
    const assistants = await this.operatorService.findAllAssistants();

    if (!coaches.length) {
      throw new NotFoundException('Operators not found');
    }

    if (!assistants.length) {
      throw new NotFoundException('Assistants not found');
    }

    const trackedParameter = await this.trackedParametersService.findTrackedParameter(
      EAllowedTrackedParameters.PATIENT_RETURN,
    );

    if (!trackedParameter) {
      throw new NotFoundException(TRACKED_PARAMETER_NOT_FOUND_ERROR);
    }

    const minNorm = trackedParameter.value;

    const operators = coaches.concat(assistants);

    const data = operators.map(async ({ _id, name }) => {
      const chats = await this.operatorService.findAllActiveChatsById(_id);

      return await this.trackedParametersService.getAveragePatientReturnByCoach(
        _id,
        name,
        minNorm,
        chats,
      );
    });

    return Promise.all(data)
      .then((data: TTrackedParameterByCoach[]) => {
        return {
          coaches: data,
          minNorm,
        };
      })
      .catch((error) => {
        throw (
          error ??
          new InternalServerErrorException(
            SOMETHING_WENT_WRONG_ERROR + 'patient return',
          )
        );
      });
  }

  @Post('patient-return/parameter')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.NO_CONTENT)
  async addAndChangePatientReturnParameter(
    @Body() parameter: TrackedParametersDto,
  ) {
    try {
      return this.trackedParametersService.createTrackedParameter(parameter);
    } catch (e) {
      throw new HttpException(PARAMETER_SAVING_ERROR, HttpStatus.FORBIDDEN);
    }
  }

  @UseGuards(new JwtAuthGuard())
  @Get('patient-return/:operatorId')
  async getPatientReturnByCoach(
    @Param() { operatorId }: GetPatientReturnByChatByAllCoachesDto,
  ) {
    const chats = await this.operatorService.findAllActiveChatsById(operatorId);

    if (!chats.length) {
      throw new NotFoundException(CHATS_FOR_OPERATOR_ID_NOT_FOUND_ERROR);
    }

    return this.trackedParametersService.getPatientReturnByCoachChats(chats);
  }
}
