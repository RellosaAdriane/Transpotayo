import { Body, Controller, Delete, Get, HttpCode, Module, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actor, CurrentActor, Roles } from '../auth/access';
import { PageQuery } from '../common/dto';
import { Driver, Role, Vehicle } from '../database/entities';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicles.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@Roles(Role.Admin)
class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  create(@Body() dto: CreateVehicleDto) { return this.vehicles.create(dto); }

  @Roles(Role.Admin, Role.Driver) @Get()
  list(@CurrentActor() actor: Actor, @Query() query: PageQuery) {
    return this.vehicles.list(actor, query);
  }

  @Roles(Role.Admin, Role.Driver) @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @CurrentActor() actor: Actor) {
    return this.vehicles.get(id, actor);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehicles.update(id, dto);
  }

  @Delete(':id') @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) { return this.vehicles.remove(id); }
}

@Module({
  imports: [TypeOrmModule.forFeature([Driver, Vehicle])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
