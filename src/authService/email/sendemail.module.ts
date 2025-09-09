import { Module } from '@nestjs/common';
import { sendEmailController } from './sendemail.controller';
import { sendEmailService } from './sendemail.service';
import { UsersModule } from 'src/modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResetPassStrategy } from '../passport/resetpass-token.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_RESETPASSWORD_KEY'),
        signOptions: {
          expiresIn: configService.get<string>('RESET_TOKEN_EXPIRED'),
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
  ],
  controllers: [sendEmailController],
  providers: [sendEmailService, ResetPassStrategy],
})
export class sendEmailModule {}
