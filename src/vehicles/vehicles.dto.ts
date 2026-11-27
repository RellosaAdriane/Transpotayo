import { IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';
import { Trim, WhenProvided } from '../common/dto';

const currentYear = new Date().getFullYear();

export class CreateVehicleDto {
  @IsInt() @Min(1)
  driverId!: number;

  @Trim() @Matches(/^[a-z0-9 -]{2,15}$/i)
  plateNumber!: string;

  @Trim() @IsString() @Length(1, 50)
  make!: string;

  @Trim() @IsString() @Length(1, 50)
  model!: string;

  @IsInt() @Min(1900) @Max(currentYear + 1)
  vehicleYear!: number;
}

export class UpdateVehicleDto {
  @WhenProvided() @IsInt() @Min(1)
  driverId?: number;

  @WhenProvided() @Trim() @Matches(/^[a-z0-9 -]{2,15}$/i)
  plateNumber?: string;

  @WhenProvided() @Trim() @IsString() @Length(1, 50)
  make?: string;

  @WhenProvided() @Trim() @IsString() @Length(1, 50)
  model?: string;

  @WhenProvided() @IsInt() @Min(1900) @Max(currentYear + 1)
  vehicleYear?: number;
}
