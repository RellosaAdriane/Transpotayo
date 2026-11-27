import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';
import { PageQuery, WhenProvided } from '../common/dto';
import { PaymentMethod, PaymentStatus } from '../database/entities';

export class CreatePaymentDto {
  @IsInt() @Min(1)
  rideId!: number;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(99999999.99)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}

export class UpdatePaymentDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}

export class PaymentQuery extends PageQuery {
  @WhenProvided() @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
