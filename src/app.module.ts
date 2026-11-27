import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { databaseOptions } from './database/config';
import { PaymentsModule } from './payments/payments.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RidesModule } from './rides/rides.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 25 }]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...databaseOptions(), retryAttempts: 2, retryDelay: 1000 }),
    }),
    AuthModule,
    ProfilesModule,
    VehiclesModule,
    RidesModule,
    PaymentsModule,
  ],
})
export class AppModule {}
