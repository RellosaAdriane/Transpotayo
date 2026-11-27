import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Actor } from '../auth/access';
import { createAccount, hashPassword } from '../auth/accounts';
import { PageQuery, pageResult } from '../common/dto';
import { found, write } from '../common/persistence';
import { ACTIVE_RIDE_STATUSES, Customer, Driver, DriverStatus, Ride, Role } from '../database/entities';
import {
  CreateDriverDto, DriverQuery, RegisterCustomerDto, UpdateCustomerDto, UpdateDriverDto,
} from './profiles.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly data: DataSource,
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
  ) {}

  async registerCustomer(dto: RegisterCustomerDto) {
    const { email, password, ...profile } = dto;
    const passwordHash = await hashPassword(password);
    return write(() => this.data.transaction(async manager => {
      const user = await createAccount(manager, email, passwordHash, Role.Customer);
      const customers = manager.getRepository(Customer);
      const customer = await customers.save(customers.create({ ...profile, userId: user.id }));
      return { ...customer, email: user.email };
    }));
  }

  async createDriver(dto: CreateDriverDto) {
    const { email, password, ...profile } = dto;
    const passwordHash = await hashPassword(password);
    return write(() => this.data.transaction(async manager => {
      const user = await createAccount(manager, email, passwordHash, Role.Driver);
      const drivers = manager.getRepository(Driver);
      const driver = await drivers.save(drivers.create({ ...profile, userId: user.id }));
      return { ...driver, email: user.email };
    }));
  }

  async listCustomers(query: PageQuery) {
    return pageResult(await this.customers.findAndCount({
      order: { id: 'ASC' }, skip: query.offset, take: query.pageSize,
    }), query);
  }

  async getCustomer(id: number, actor: Actor) {
    this.checkCustomerAccess(id, actor);
    return found(await this.customers.findOneBy({ id }), 'Customer');
  }

  async updateCustomer(id: number, actor: Actor, dto: UpdateCustomerDto) {
    this.checkCustomerAccess(id, actor);
    return write(() => this.data.transaction(async manager => {
      const customers = manager.getRepository(Customer);
      const customer = found(await customers.findOne({
        where: { id }, lock: { mode: 'pessimistic_write' },
      }), 'Customer');
      return customers.save(customers.merge(customer, dto));
    }));
  }

  async deactivateCustomer(id: number) {
    return write(() => this.data.transaction(async manager => {
      const customers = manager.getRepository(Customer);
      found(await customers.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } }), 'Customer');
      const active = await manager.getRepository(Ride).existsBy({
        customerId: id, status: In(ACTIVE_RIDE_STATUSES),
      });
      if (active) throw new ConflictException('Resolve active rides before deactivating this customer');
      await customers.softDelete(id);
    }));
  }

  async listDrivers(query: DriverQuery) {
    return pageResult(await this.drivers.findAndCount({
      where: query.status === undefined ? {} : { status: query.status },
      order: { id: 'ASC' }, skip: query.offset, take: query.pageSize,
    }), query);
  }

  async getDriver(id: number) {
    return found(await this.drivers.findOneBy({ id }), 'Driver');
  }

  async updateDriver(id: number, dto: UpdateDriverDto) {
    return write(() => this.data.transaction(async manager => {
      const drivers = manager.getRepository(Driver);
      const driver = found(await drivers.findOne({
        where: { id }, lock: { mode: 'pessimistic_write' },
      }), 'Driver');
      if (dto.status === DriverStatus.Inactive && await manager.getRepository(Ride).existsBy({
        driverId: id, status: In(ACTIVE_RIDE_STATUSES),
      })) {
        throw new ConflictException('Resolve assigned rides before deactivating this driver');
      }
      return drivers.save(drivers.merge(driver, dto));
    }));
  }

  private checkCustomerAccess(id: number, actor: Actor) {
    if (actor.role !== Role.Admin && actor.profileId !== id) {
      throw new ForbiddenException('You can only access your own customer profile');
    }
  }
}

