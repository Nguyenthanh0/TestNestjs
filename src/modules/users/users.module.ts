import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import * as Minio from 'minio';
import { PostModule } from '../post/post.module';
import { MailModule } from '../mail/mail.module';

@Module({
  exports: [MongooseModule, UsersService, 'MINIO_CLIENT'],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRED'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    forwardRef(() => PostModule),
    MailModule,
  ],
  controllers: [UsersController, AdminController],
  providers: [
    UsersService,
    {
      provide: 'MINIO_CLIENT',
      useFactory: (configService: ConfigService): Minio.Client => {
        return new Minio.Client({
          endPoint: configService.get<string>('MINIO_ENDPOINT')!,
          port: parseInt(configService.get<string>('MINIO_PORT')!, 10),
          useSSL:
            (configService.get<string>('MINIO_USE_SSL') ?? 'false') === 'true',
          accessKey: configService.get<string>('MINIO_ROOT_USER'),
          secretKey: configService.get<string>('MINIO_ROOT_PASSWORD'),
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class UsersModule {}
