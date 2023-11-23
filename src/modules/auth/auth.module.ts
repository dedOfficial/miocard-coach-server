import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { OperatorModule } from '../operator/operator.module';
import { DoctorModule } from '../doctor/doctor.module';
import { MessageModule } from 'modules/message/message.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Pin, PinSchema } from './models/pin.model';
import { PushToken, PushTokenSchema } from './models/pushToken.model';

@Module({
  imports: [
    DoctorModule,
    ConfigModule,
    MessageModule,
    MongooseModule.forFeature([
      { name: Pin.name, schema: PinSchema },
      { name: PushToken.name, schema: PushTokenSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule, OperatorModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '365d' },
      }),
      inject: [ConfigService],
    }),
    OperatorModule,
  ],
  providers: [FacebookStrategy, JwtStrategy, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
