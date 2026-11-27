import { Body, Controller, Get, HttpCode, Module, Post, UseGuards } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer, Driver, User } from '../database/entities';
import { Actor, CurrentActor, Public } from './access';
import { AccessGuard } from './access.guard';
import { AuthService, LoginDto } from './auth.service';

@Controller('auth')
class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }

  @Get('me')
  me(@CurrentActor() actor: Actor) { return actor; }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Customer, Driver]),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || Buffer.byteLength(secret) < 32) {
          throw new Error('Set JWT_SECRET in .env to a random value of at least 32 bytes');
        }
        return { secret, signOptions: { algorithm: 'HS256', expiresIn: '1h' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AccessGuard }],
})
export class AuthModule {}
