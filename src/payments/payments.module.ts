import { Body, Controller, Delete, Get, HttpCode, Module, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actor, CurrentActor, Roles } from '../auth/access';
import { Payment, Ride, Role } from '../database/entities';
import { CreatePaymentDto, PaymentQuery, UpdatePaymentDto } from './payments.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@Roles(Role.Admin, Role.Customer)
class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Roles(Role.Customer) @Post()
  create(@CurrentActor() actor: Actor, @Body() dto: CreatePaymentDto) {
    return this.payments.create(actor, dto);
  }

  @Get()
  list(@CurrentActor() actor: Actor, @Query() query: PaymentQuery) {
    return this.payments.list(actor, query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @CurrentActor() actor: Actor) {
    return this.payments.get(id, actor);
  }

  @Roles(Role.Admin) @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
    return this.payments.update(id, dto);
  }

  @Roles(Role.Admin) @Delete(':id') @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) { return this.payments.remove(id); }
}

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Ride])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
