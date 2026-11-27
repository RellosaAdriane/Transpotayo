import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createAccount, hashPassword } from '../auth/accounts';
import { databaseOptions } from './config';
import { Customer, Driver, Role, User, Vehicle } from './entities';

async function seed() {
  const roles = [Role.Admin, Role.Driver, Role.Customer];
  const accounts = await Promise.all(roles.map(async role => {
    const password = process.env['DEMO_' + role.toUpperCase() + '_PASSWORD'];
    if (!password) throw new Error('Set DEMO_' + role.toUpperCase() + '_PASSWORD in .env');
    return {
      role, email: role + '@transportayo.test', passwordHash: await hashPassword(password),
    };
  }));

  const source = new DataSource(databaseOptions());
  await source.initialize();
  try {
    await source.transaction(async manager => {
      for (const account of accounts) {
        const existing = await manager.getRepository(User).findOneBy({ email: account.email });
        if (existing) {
          if (existing.role !== account.role) throw new Error('Demo email belongs to a different role');
          await manager.update(User, existing.id, { passwordHash: account.passwordHash });
          continue;
        }
        const user = await createAccount(manager, account.email, account.passwordHash, account.role);
        if (user.role === Role.Customer) {
          await manager.insert(Customer, {
            userId: user.id, firstName: 'Demo', lastName: 'Customer', phone: '09170000001',
          });
        }
        if (user.role === Role.Driver) {
          const drivers = manager.getRepository(Driver);
          await drivers.save(drivers.create({
            userId: user.id, firstName: 'Demo', lastName: 'Driver',
            phone: '09170000002', licenseNumber: 'DEMO-LICENSE',
          }));
        }
      }
      const driverAccount = await manager.findOneByOrFail(User, { email: 'driver@transportayo.test' });
      const driver = await manager.findOneByOrFail(Driver, { userId: driverAccount.id });
      const vehicle = await manager.findOneBy(Vehicle, { plateNumber: 'DEMO-001' });
      if (vehicle && vehicle.driverId !== driver.id) {
        throw new Error('DEMO-001 belongs to a different driver');
      }
      if (!vehicle) {
        await manager.insert(Vehicle, {
          driverId: driver.id, plateNumber: 'DEMO-001', make: 'Toyota', model: 'Vios', vehicleYear: 2023,
        });
      }
    });
    console.log('Demo accounts ready. Log in using admin, driver or customer @transportayo.test and the matching password in .env.');
  } finally {
    await source.destroy();
  }
}

seed().catch((error: Error) => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
});
