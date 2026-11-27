import { IsEnum, IsInt, IsNumber, IsString, Length, Max, Min } from 'class-validator';
import { PageQuery, Trim, WhenProvided } from '../common/dto';
import { RideStatus } from '../database/entities';

export class RequestRideDto {
  @Trim() @IsString() @Length(1, 255)
  pickupLocation!: string;

  @Trim() @IsString() @Length(1, 255)
  dropoffLocation!: string;
}

export class ChangeRideDto {
  @IsEnum(RideStatus)
  status!: RideStatus;

  @WhenProvided() @IsInt() @Min(1)
  vehicleId?: number;

  @WhenProvided() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(99999999.99)
  fare?: number;
}

export class RideQuery extends PageQuery {
  @WhenProvided() @IsEnum(RideStatus)
  status?: RideStatus;
}
