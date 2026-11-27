import { IsEmail, IsEnum, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PageQuery, Trim, WhenProvided } from '../common/dto';
import { DriverStatus } from '../database/entities';

export class RegisterCustomerDto {
  @Trim() @IsString() @Length(1, 50)
  firstName!: string;

  @Trim() @IsString() @Length(1, 50)
  lastName!: string;

  @Trim() @Matches(/^\+?[0-9]{7,15}$/)
  phone!: string;

  @Trim() @IsEmail() @MaxLength(254)
  email!: string;

  @IsString() @Length(8, 72)
  password!: string;
}

export class CreateDriverDto extends RegisterCustomerDto {
  @Trim() @IsString() @Length(1, 30)
  licenseNumber!: string;
}

export class UpdateCustomerDto {
  @WhenProvided() @Trim() @IsString() @Length(1, 50)
  firstName?: string;

  @WhenProvided() @Trim() @IsString() @Length(1, 50)
  lastName?: string;

  @WhenProvided() @Trim() @Matches(/^\+?[0-9]{7,15}$/)
  phone?: string;
}

export class UpdateDriverDto extends UpdateCustomerDto {
  @WhenProvided() @Trim() @IsString() @Length(1, 30)
  licenseNumber?: string;

  @WhenProvided() @IsEnum(DriverStatus)
  status?: DriverStatus;
}

export class DriverQuery extends PageQuery {
  @WhenProvided() @IsEnum(DriverStatus)
  status?: DriverStatus;
}
