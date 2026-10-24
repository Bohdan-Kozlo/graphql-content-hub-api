import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { PasswordRecoveryService } from './password-recovery.service';
import { PasswordRecoveryMailer } from './password-recovery.mailer';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleIdentityService } from './google-identity.service';
import { GoogleAuthController } from './google-auth.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: configService.getOrThrow('JWT_EXPIRATION_TIME') },
      }),
    }),
    UserModule,
  ],
  providers: [
    AuthResolver,
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    PasswordRecoveryService,
    PasswordRecoveryMailer,
    GoogleStrategy,
    GoogleIdentityService,
  ],
  controllers: [GoogleAuthController],
})
export class AuthModule {}
