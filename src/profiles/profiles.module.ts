import {
  Body, Controller, Delete, Get, HttpCode, Module, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actor, CurrentActor, Public, Roles } from '../auth/access';
import { PageQuery } from '../common/dto';
import { Customer, Driver, Role } from '../database/entities';
import {
  CreateDriverDto, DriverQuery, RegisterCustomerDto, UpdateCustomerDto, UpdateDriverDto,
} from './profiles.dto';
import { ProfilesService } from './profiles.service';

@Controller('customers')
@Roles(Role.Admin)
class CustomersController {
  constructor(private readonly profiles: ProfilesService) {}

  @Public() @UseGuards(ThrottlerGuard) @Post()
  create(@Body() dto: RegisterCustomerDto) { return this.profiles.registerCustomer(dto); }

  @Get()
  list(@Query() query: PageQuery) { return this.profiles.listCustomers(query); }

  @Roles(Role.Admin, Role.Customer) @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @CurrentActor() actor: Actor) {
    return this.profiles.getCustomer(id, actor);
  }

  @Roles(Role.Admin, Role.Customer) @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @CurrentActor() actor: Actor, @Body() dto: UpdateCustomerDto) {
    return this.profiles.updateCustomer(id, actor, dto);
  }

  @Delete(':id') @HttpCode(204)
  deactivate(@Param('id', ParseIntPipe) id: number) { return this.profiles.deactivateCustomer(id); }
}

@Controller('drivers')
@Roles(Role.Admin)
class DriversController {
  constructor(private readonly profiles: ProfilesService) {}

  @Post()
  create(@Body() dto: CreateDriverDto) { return this.profiles.createDriver(dto); }

  @Get()
  list(@Query() query: DriverQuery) { return this.profiles.listDrivers(query); }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) { return this.profiles.getDriver(id); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDriverDto) {
    return this.profiles.updateDriver(id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Driver])],
  controllers: [CustomersController, DriversController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
