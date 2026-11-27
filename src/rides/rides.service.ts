import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, In, Repository } from 'typeorm';
import { Actor } from '../auth/access';
import { pageResult } from '../common/dto';
import { found, write } from '../common/persistence';
import { Customer, Driver, DriverStatus, Ride, RideStatus, Role, Vehicle } from '../database/entities';
import { ChangeRideDto, RequestRideDto, RideQuery } from './rides.dto';

const transitions: Record<RideStatus, RideStatus[]> = {
  [RideStatus.Requested]: [RideStatus.Accepted, RideStatus.Cancelled],
  [RideStatus.Accepted]: [RideStatus.Requested, RideStatus.InProgress, RideStatus.Cancelled],
  [RideStatus.InProgress]: [RideStatus.Completed],
  [RideStatus.Completed]: [],
  [RideStatus.Cancelled]: [],
};

@Injectable()
export class RidesService {
  constructor(
    private readonly data: DataSource,
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
  ) {}

  request(actor: Actor, dto: RequestRideDto) {
    if (dto.pickupLocation.toLowerCase() === dto.dropoffLocation.toLowerCase()) {
      throw new BadRequestException('Pickup and drop-off must be different');
    }
    return write(() => this.data.transaction(async manager => {
      const customerId = actor.profileId!;
      found(await manager.getRepository(Customer).findOne({
        where: { id: customerId }, lock: { mode: 'pessimistic_write' },
      }), 'Customer');
      const rides = manager.getRepository(Ride);
      return rides.save(rides.create({ ...dto, customerId }));
    }));
  }

  async list(actor: Actor, query: RideQuery) {
    const filter: FindOptionsWhere<Ride> = query.status ? { status: query.status } : {};
    let where: FindOptionsWhere<Ride> | FindOptionsWhere<Ride>[] = filter;
    if (actor.role === Role.Customer) where = { ...filter, customerId: actor.profileId! };
    if (actor.role === Role.Driver) {
      where = [{ ...filter, driverId: actor.profileId! }];
      if (!query.status || query.status === RideStatus.Requested) where.push({ status: RideStatus.Requested });
    }
    return pageResult(await this.rides.findAndCount({
      where, order: { id: 'DESC' }, skip: query.offset, take: query.pageSize,
    }), query);
  }

  async get(id: number, actor: Actor) {
    const ride = found(await this.rides.findOneBy({ id }), 'Ride');
    this.checkAccess(ride, actor);
    return ride;
  }

  change(id: number, actor: Actor, dto: ChangeRideDto) {
    return write(() => this.data.transaction('READ COMMITTED', async manager => {
      const rides = manager.getRepository(Ride);
      const ride = found(await rides.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } }), 'Ride');
      this.checkAccess(ride, actor);
      if (actor.role === Role.Customer && dto.status !== RideStatus.Cancelled) {
        throw new ForbiddenException('Customers can only cancel a ride');
      }
      if (actor.role === Role.Driver && dto.status === RideStatus.Cancelled) {
        throw new ForbiddenException('Drivers can release an accepted ride');
      }
      if (!transitions[ride.status].includes(dto.status)) {
        throw new ConflictException('Cannot change this ride from ' + ride.status + ' to ' + dto.status);
      }
      if (dto.status === RideStatus.Accepted) {
        await this.assign(manager, ride, actor, dto);
      } else if (dto.vehicleId !== undefined || dto.fare !== undefined) {
        throw new BadRequestException('Vehicle and fare are only accepted when assigning a ride');
      }
      if (dto.status === RideStatus.Requested) {
        ride.driverId = null;
        ride.vehicleId = null;
        ride.fare = '0.00';
      }
      ride.status = dto.status;
      return rides.save(ride);
    }));
  }

  remove(id: number, actor: Actor) {
    return write(() => this.data.transaction('READ COMMITTED', async manager => {
      const rides = manager.getRepository(Ride);
      const ride = found(await rides.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } }), 'Ride');
      this.checkAccess(ride, actor);
      if (![RideStatus.Requested, RideStatus.Cancelled].includes(ride.status) || ride.driverId !== null) {
        throw new ConflictException('Only unassigned requested or cancelled rides can be deleted');
      }
      await rides.delete(id);
    }));
  }

  private async assign(manager: EntityManager, ride: Ride, actor: Actor, dto: ChangeRideDto) {
    if (dto.vehicleId === undefined || dto.fare === undefined) {
      throw new BadRequestException('vehicleId and fare are required to accept a ride');
    }
    const vehicles = manager.getRepository(Vehicle);
    const vehicle = found(await vehicles.findOneBy({ id: dto.vehicleId }), 'Vehicle');
    if (actor.role === Role.Driver && vehicle.driverId !== actor.profileId) {
      throw new ForbiddenException('Drivers can only accept a ride with their own vehicle');
    }
    // Lock the driver so competing requests cannot both assign the same person.
    const driver = found(await manager.getRepository(Driver).findOne({
      where: { id: vehicle.driverId }, lock: { mode: 'pessimistic_write' },
    }), 'Driver');
    const lockedVehicle = found(await vehicles.findOne({
      where: { id: vehicle.id }, lock: { mode: 'pessimistic_write' },
    }), 'Vehicle');
    if (lockedVehicle.driverId !== driver.id) throw new ConflictException('Vehicle assignment changed. Retry the request.');
    if (driver.status !== DriverStatus.Available) throw new ConflictException('Driver is unavailable');

    const active = await manager.getRepository(Ride).existsBy({
      driverId: driver.id, status: In([RideStatus.Accepted, RideStatus.InProgress]),
    });
    if (active) throw new ConflictException('Driver already has an active ride');
    ride.driverId = driver.id;
    ride.vehicleId = lockedVehicle.id;
    ride.fare = dto.fare.toFixed(2);
  }

  private checkAccess(ride: Ride, actor: Actor) {
    if (actor.role === Role.Admin) return;
    if (actor.role === Role.Customer && ride.customerId === actor.profileId) return;
    if (actor.role === Role.Driver && (ride.driverId === actor.profileId || ride.status === RideStatus.Requested)) return;
    throw new ForbiddenException('This ride is outside your account');
  }
}

