import { Body, Controller, Delete, Get, HttpCode, Module, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actor, CurrentActor, Roles } from '../auth/access';
import { Ride, Role } from '../database/entities';
import { ChangeRideDto, RequestRideDto, RideQuery } from './rides.dto';
import { RidesService } from './rides.service';

@Controller('rides')
class RidesController {
  constructor(private readonly rides: RidesService) {}

  @Roles(Role.Customer) @Post()
  request(@CurrentActor() actor: Actor, @Body() dto: RequestRideDto) {
    return this.rides.request(actor, dto);
  }

  @Get()
  list(@CurrentActor() actor: Actor, @Query() query: RideQuery) {
    return this.rides.list(actor, query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @CurrentActor() actor: Actor) {
    return this.rides.get(id, actor);
  }

  @Patch(':id')
  change(@Param('id', ParseIntPipe) id: number, @CurrentActor() actor: Actor, @Body() dto: ChangeRideDto) {
    return this.rides.change(id, actor, dto);
  }

  @Roles(Role.Admin, Role.Customer) @Delete(':id') @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentActor() actor: Actor) {
    return this.rides.remove(id, actor);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Ride])],
  controllers: [RidesController],
  providers: [RidesService],
})
export class RidesModule {}
