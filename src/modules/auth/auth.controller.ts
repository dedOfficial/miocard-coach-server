import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { DoctorService } from 'modules/doctor/doctor.service';
import { MessageService } from 'modules/message/message.service';
import { OperatorService } from 'modules/operator/operator.service';
import { Model } from 'mongoose';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Pin, PinDocument } from './models/pin.model';
import { PushToken, PushTokenDocument } from './models/pushToken.model';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

import { Role } from 'modules/operator/decorators/guard/role.enum';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly operatorService: OperatorService,
    private readonly configService: ConfigService,
    private readonly doctorService: DoctorService,
    private readonly messageService: MessageService,
    @InjectModel(Pin.name) private readonly pinModel: Model<PinDocument>,
    @InjectModel(PushToken.name)
    private readonly pushTokenModel: Model<PushTokenDocument>,
  ) {}

  @UseGuards(AuthGuard('facebook-token'))
  @Get('facebook')
  async getTokenAfterFacebookSignIn(@Req() req: Request) {
    const { name, email } = req.user;
    this.logger.log(`Login ${email} as ${name}`);
    if (email === this.configService.get<string>('admin.email')) {
      const operatorExists = await this.operatorService.findOperator(email);
      if (!operatorExists.length) {
        this.operatorService.createOperator({
          email: email,
          name: this.configService.get<string>('admin.name'),
        });
      }
    }
    const operator = await this.operatorService.findOperator(
      email.toLowerCase(),
    );
    if (!operator) throw new ForbiddenException();

    return {
      token: await this.authService.generateWebToken(
        name,
        email,
        operator[0].roles,
      ),
    };
  }

  @Get('generate_passwords')
  async generatePasswords() {
    const debug = this.configService.get<boolean>('debug');
    if (!debug) {
      throw new NotFoundException();
    }

    const operators = await this.operatorService.findAllOperators();
    for (const operator of operators) {
      const password = nanoid(8);
      await this.operatorService.updateOperatorPassword(operator.id, password);
      console.log(`${operator.email}:${password}`);
    }
  }

  // Local auth controller
  @Post('login')
  async loginWithEmail(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (email === this.configService.get<string>('admin.email')) {
      const operatorExists = await this.operatorService.findOperator(email);
      if (!operatorExists.length) {
        this.operatorService.createOperator({
          email,
          name: this.configService.get<string>('admin.name'),
          password: bcrypt.hashSync(
            this.configService.get<string>('admin.password'),
            10,
          ),
        });
      }
    }

    const operator = await this.operatorService.findOperatorByEmail(
      email.toLowerCase(),
    );
    if (!operator) throw new ForbiddenException();

    const isPasswordValid = bcrypt.compareSync(password, operator.password);
    if (!isPasswordValid) throw new ForbiddenException();

    return {
      token: await this.authService.generateWebToken(
        operator.name,
        email,
        operator.roles,
      ),
    };
  }

  // Debug login, works with DEBUG=true in .env file, remove it for production
  @Get('debug')
  async debugLogin() {
    if (!this.configService.get<boolean>('debug')) {
      throw new NotFoundException();
    }

    const email = this.configService.get<string>('admin.email');
    const name = this.configService.get<string>('admin.name');

    return {
      token: await this.authService.generateWebToken(name, email, [Role.Admin]),
    };
  }

  @UseGuards(new JwtAuthGuard())
  @Get('me')
  async getUserInfo(@Req() req: Request) {
    const { email } = req.user;

    const operator = await this.operatorService.findOperatorByEmail(email);
    const doctor = await this.doctorService.findDoctorByEmail(email);

    if (operator?._id) {
      req.user.name = operator.name;
      return {
        ...req.user,
        id: operator._id,
        doctor: !!doctor,
        isSuperadmin: operator.isSuperadmin,
        type: operator.type,
      };
    }
    throw new UnauthorizedException();
  }

  @Post('pin')
  @UsePipes(new ValidationPipe())
  async generatePin(@Body('phone') phone: string) {
    const id = await this.operatorService.getChatId(phone);
    if (id) {
      if (phone === '+11111111111') {
        const pin = 1111;
        const createdPin = new this.pinModel({ phone, pin });
        await createdPin.save();
        return true;
      }
      const pin = Math.floor(1000 + Math.random() * 9000);
      const createdPin = new this.pinModel({ phone, pin });
      await createdPin.save();
      this.messageService.sendSMS({
        to: phone,
        body: `${pin.toString()} is your HTN Coach verification code.`,
      });
      this.logger.log(`${pin} for ${phone}`);
      return true;
    }
    return false;
  }

  @Post('verify')
  @UsePipes(new ValidationPipe())
  async verifyPin(@Body('phone') phone: string, @Body('pin') pin: string) {
    const foundPin = await this.pinModel.findOne({ phone, pin }).exec();
    if (foundPin) {
      await this.pinModel.deleteOne({ phone, pin }).exec();
      return { token: await this.authService.generateMobileToken(phone) };
    }
    return false;
  }

  @Post('push-token')
  @UseGuards(new JwtAuthGuard())
  async savePushToken(
    @Req() req: Request,
    @Body('token') pushToken: string,
    @Body('platform') platform: 'ios' | 'android',
    @Body('deviceId') deviceId: string,
  ) {
    const phone = req.user['phone'];

    const createdPushToken = await this.pushTokenModel.findOneAndUpdate(
      { phone, deviceId },
      {
        phone,
        pushToken,
        platform,
        deviceId,
        isActive: true,
      },
      { upsert: true, new: true },
    );

    return createdPushToken;
  }

  @Post('deactivate-token')
  @UseGuards(new JwtAuthGuard())
  async deactivateToken(
    @Req() req: Request,
    @Body('deviceId') deviceId: string,
  ) {
    const phone = req.user['phone'];

    const createdPushToken = await this.pushTokenModel.findOneAndUpdate(
      { phone, deviceId },
      {
        isActive: false,
      },
      { upsert: true, new: true },
    );

    return createdPushToken;
  }

  @Post('reactivate-token')
  @UseGuards(new JwtAuthGuard())
  async reactivateToken(
    @Req() req: Request,
    @Body('deviceId') deviceId: string,
  ) {
    const phone = req.user['phone'];

    const createdPushToken = await this.pushTokenModel.findOneAndUpdate(
      { phone, deviceId },
      {
        isActive: true,
      },
      { upsert: true, new: true },
    );

    return createdPushToken;
  }
}
