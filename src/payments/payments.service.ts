import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Actor } from '../auth/access';
import { pageResult } from '../common/dto';
import { found, write } from '../common/persistence';
import { Payment, PaymentStatus, Ride, RideStatus, Role } from '../database/entities';
import { CreatePaymentDto, PaymentQuery, UpdatePaymentDto } from './payments.dto';

const transitions: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.Pending]: [PaymentStatus.Paid, PaymentStatus.Failed],
  [PaymentStatus.Paid]: [PaymentStatus.Refunded],
  [PaymentStatus.Failed]: [],
  [PaymentStatus.Refunded]: [],
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly data: DataSource,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
  ) {}

  create(actor: Actor, dto: CreatePaymentDto) {
    return write(() => this.data.transaction(async manager => {
      const ride = found(await manager.getRepository(Ride).findOne({
        where: { id: dto.rideId }, lock: { mode: 'pessimistic_write' },
      }), 'Ride');
      this.checkOwnership(ride, actor);
      if (ride.status !== RideStatus.Completed) {
        throw new ConflictException('Payments require a completed ride');
      }
      const amount = dto.amount.toFixed(2);
      if (amount !== ride.fare) throw new BadRequestException('Payment amount must match the ride fare');
      const payments = manager.getRepository(Payment);
      return payments.save(payments.create({ ...dto, amount }));
    }));
  }

  async list(actor: Actor, query: PaymentQuery) {
    const where: FindOptionsWhere<Payment> = {};
    if (actor.role === Role.Customer) where.ride = { customerId: actor.profileId! };
    if (query.status) where.status = query.status;
    return pageResult(await this.payments.findAndCount({
      where, order: { id: 'DESC' }, skip: query.offset, take: query.pageSize,
    }), query);
  }

  async get(id: number, actor: Actor) {
    const payment = found(await this.payments.findOneBy({ id }), 'Payment');
    if (actor.role === Role.Customer) {
      const ride = found(await this.rides.findOneBy({ id: payment.rideId }), 'Ride');
      this.checkOwnership(ride, actor);
    }
    return payment;
  }

  update(id: number, dto: UpdatePaymentDto) {
    return write(() => this.data.transaction(async manager => {
      const payments = manager.getRepository(Payment);
      const payment = found(await payments.findOne({
        where: { id }, lock: { mode: 'pessimistic_write' },
      }), 'Payment');
      if (!transitions[payment.status].includes(dto.status)) {
        throw new ConflictException('Cannot change this payment from ' + payment.status + ' to ' + dto.status);
      }
      payment.status = dto.status;
      return payments.save(payment);
    }));
  }

  remove(id: number) {
    return write(() => this.data.transaction(async manager => {
      const payments = manager.getRepository(Payment);
      const payment = found(await payments.findOne({
        where: { id }, lock: { mode: 'pessimistic_write' },
      }), 'Payment');
      if (![PaymentStatus.Pending, PaymentStatus.Failed].includes(payment.status)) {
        throw new ConflictException('Only pending or failed payments can be deleted');
      }
      await payments.delete(id);
    }));
  }

  private checkOwnership(ride: Ride, actor: Actor) {
    if (actor.role === Role.Customer && ride.customerId !== actor.profileId) {
      throw new ForbiddenException('This payment is outside your account');
    }
  }
}
