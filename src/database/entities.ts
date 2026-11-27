import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn,
  ManyToOne, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';

export enum Role { Customer = 'customer', Driver = 'driver', Admin = 'admin' }
export enum DriverStatus { Available = 'available', Busy = 'busy', Inactive = 'inactive' }
export enum RideStatus {
  Requested = 'requested', Accepted = 'accepted', InProgress = 'in-progress',
  Completed = 'completed', Cancelled = 'cancelled',
}
export enum PaymentMethod { Cash = 'cash', Card = 'card', EWallet = 'e-wallet' }
export enum PaymentStatus { Pending = 'pending', Paid = 'paid', Failed = 'failed', Refunded = 'refunded' }

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ length: 254, unique: true }) email!: string;
  @Column({ length: 60, select: false }) passwordHash!: string;
  @Column({ type: 'enum', enum: Role }) role!: Role;
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true }) userId!: number;
  @OneToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' }) user!: User;
  @Column({ length: 50 }) firstName!: string;
  @Column({ length: 50 }) lastName!: string;
  @Column({ length: 20, unique: true }) phone!: string;
  @CreateDateColumn() dateRegistered!: Date;
  @DeleteDateColumn() deactivatedAt!: Date | null;
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true }) userId!: number;
  @OneToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' }) user!: User;
  @Column({ length: 50 }) firstName!: string;
  @Column({ length: 50 }) lastName!: string;
  @Column({ length: 20, unique: true }) phone!: string;
  @Column({ length: 30, unique: true }) licenseNumber!: string;
  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.Available }) status!: DriverStatus;
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn() id!: number;
  @Column() driverId!: number;
  @ManyToOne(() => Driver, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driverId' }) driver!: Driver;
  @Column({ length: 15, unique: true }) plateNumber!: string;
  @Column({ length: 50 }) make!: string;
  @Column({ length: 50 }) model!: string;
  @Column({ type: 'smallint', unsigned: true }) vehicleYear!: number;
}

@Entity('rides')
@Index(['driverId', 'status'])
export class Ride {
  @PrimaryGeneratedColumn() id!: number;
  @Column() customerId!: number;
  @ManyToOne(() => Customer, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' }) customer!: Customer;
  @Column({ type: 'int', nullable: true }) driverId!: number | null;
  @ManyToOne(() => Driver, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driverId' }) driver!: Driver | null;
  @Column({ type: 'int', nullable: true }) vehicleId!: number | null;
  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicleId' }) vehicle!: Vehicle | null;
  @Column({ length: 255 }) pickupLocation!: string;
  @Column({ length: 255 }) dropoffLocation!: string;
  @CreateDateColumn() requestDateTime!: Date;
  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.Requested }) status!: RideStatus;
  @Column({ type: 'decimal', precision: 10, scale: 2, unsigned: true, default: 0 }) fare!: string;
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true }) rideId!: number;
  @OneToOne(() => Ride, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rideId' }) ride!: Ride;
  @CreateDateColumn() paymentDateTime!: Date;
  @Column({ type: 'decimal', precision: 10, scale: 2, unsigned: true }) amount!: string;
  @Column({ type: 'enum', enum: PaymentMethod }) method!: PaymentMethod;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.Pending }) status!: PaymentStatus;
}

export const entities = [User, Customer, Driver, Vehicle, Ride, Payment];

export const ACTIVE_RIDE_STATUSES = [RideStatus.Requested, RideStatus.Accepted, RideStatus.InProgress];
