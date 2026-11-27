import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Actor } from '../auth/access';
import { PageQuery, pageResult } from '../common/dto';
import { found, write } from '../common/persistence';
import { Driver, Ride, Role, Vehicle } from '../database/entities';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly data: DataSource,
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
  ) {}

  async create(dto: CreateVehicleDto) {
    found(await this.drivers.findOneBy({ id: dto.driverId }), 'Driver');
    return write(() => this.vehicles.save(this.vehicles.create({
      ...dto, plateNumber: dto.plateNumber.toUpperCase(),
    })));
  }

  async list(actor: Actor, query: PageQuery) {
    return pageResult(await this.vehicles.findAndCount({
      where: actor.role === Role.Driver ? { driverId: actor.profileId! } : {},
      order: { id: 'ASC' }, skip: query.offset, take: query.pageSize,
    }), query);
  }

  async get(id: number, actor: Actor) {
    const vehicle = found(await this.vehicles.findOneBy({ id }), 'Vehicle');
    if (actor.role === Role.Driver && vehicle.driverId !== actor.profileId) {
      throw new ForbiddenException('You can only view your own vehicles');
    }
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto) {
    return write(() => this.data.transaction(async manager => {
      const vehicles = manager.getRepository(Vehicle);
      const vehicle = found(await vehicles.findOne({
        where: { id }, lock: { mode: 'pessimistic_write' },
      }), 'Vehicle');
      if (dto.driverId !== undefined && dto.driverId !== vehicle.driverId) {
        found(await manager.getRepository(Driver).findOneBy({ id: dto.driverId }), 'Driver');
        if (await manager.getRepository(Ride).existsBy({ vehicleId: id })) {
          throw new ConflictException('Vehicles with ride history cannot be reassigned');
        }
      }
      const updates = { ...dto, plateNumber: dto.plateNumber?.toUpperCase() };
      return vehicles.save(vehicles.merge(vehicle, updates));
    }));
  }

  async remove(id: number) {
    const result = await write(() => this.vehicles.delete(id));
    found(result.affected ? result : null, 'Vehicle');
  }
}
