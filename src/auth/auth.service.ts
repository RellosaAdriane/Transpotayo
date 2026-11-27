import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Trim } from '../common/dto';
import { Customer, Driver, DriverStatus, Role, User } from '../database/entities';
import { Actor } from './access';

export class LoginDto {
  @Trim() @IsEmail() @MaxLength(254)
  email!: string;

  @IsString() @Length(1, 72)
  password!: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, email: true, role: true, passwordHash: true },
    });
    // A missing email still goes through a bcrypt comparison.
    const passwordHash = user?.passwordHash ?? '$2b$12$OM7DLodYQKNpv6J50Xjrq.G/zOiTNxfK7DlR/AMiHkdgOYYhQQAI2';
    const valid = await compare(dto.password, passwordHash);
    if (!user || !valid || Buffer.byteLength(dto.password) > 72) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const actor = await this.resolveActor(user);
    return { accessToken: await this.jwt.signAsync({ sub: actor.userId, role: actor.role }), user: actor };
  }

  async authenticate(token: string): Promise<Actor> {
    let payload: { sub: number };
    try {
      payload = await this.jwt.verifyAsync(token, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('Invalid or expired bearer token');
    }
    if (!Number.isSafeInteger(payload?.sub) || payload.sub < 1) throw new UnauthorizedException();
    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user) throw new UnauthorizedException();
    return this.resolveActor(user);
  }

  private async resolveActor(user: User): Promise<Actor> {
    let profileId: number | null = null;
    if (user.role === Role.Customer) {
      const customer = await this.customers.findOneBy({ userId: user.id });
      if (!customer) throw new UnauthorizedException('Account is inactive');
      profileId = customer.id;
    }
    if (user.role === Role.Driver) {
      const driver = await this.drivers.findOneBy({ userId: user.id });
      if (!driver || driver.status === DriverStatus.Inactive) {
        throw new UnauthorizedException('Account is inactive');
      }
      profileId = driver.id;
    }
    return { userId: user.id, email: user.email, role: user.role, profileId };
  }
}
