# Transportayo

Transportayo is the backend prototype for the Web-Based Ride Booking and Transportation Assistance System proposed in Lab 03. It has 28 REST endpoints covering system checks, login, customers, drivers, vehicles, rides, and payment records. It uses Node.js, NestJS, TypeORM, MySQL (tested on XAMPP MariaDB), bcrypt and JWT. Postman serves as the client for the demo.

## Run locally on Windows

1. Use Node.js 22 or later. Start **MySQL** in XAMPP. Start **Apache** if you want to open phpMyAdmin.
2. On a fresh checkout, run `npm.cmd ci` and `Copy-Item .env.example .env`. If your folder already has an `.env` and the prototype database, keep them and skip to step 5.
3. In [phpMyAdmin](http://localhost/phpmyadmin), create an empty database named `transportayo_prototype`. Set `DB_SYNC=true` in `.env` so `npm.cmd run db:seed` creates the tables.
4. Edit `.env`. Match the host, port, user and password to your local MySQL settings. Use `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` to generate `JWT_SECRET`. Set separate local demo passwords (8 to 72 UTF-8 bytes) for the three `DEMO_*_PASSWORD` fields.
5. Run `npm.cmd run db:seed` in the project folder. Once seeding succeeds, set `DB_SYNC=false` in `.env` and start the API.

   ```powershell
   npm.cmd run start:dev
   ```

The API listens at `http://127.0.0.1:3000/api`. If port 3000 is already in use, use the running Transportayo instance or match the new `PORT` in both `.env` and Postman's `baseUrl`. Run `npm.cmd run build` for a TypeScript build.

## Run in Postman

Import [Transportayo.postman_collection.json](postman/Transportayo.postman_collection.json). Set these **local values** in the collection's **Variables** tab.

| Variable | Value from your local file | Demo email |
| --- | --- | --- |
| `adminPassword` | `DEMO_ADMIN_PASSWORD` | `admin@transportayo.test` |
| `driverPassword` | `DEMO_DRIVER_PASSWORD` | `driver@transportayo.test` |
| `customerPassword` | `DEMO_CUSTOMER_PASSWORD` | `customer@transportayo.test` |

Start in **System Checks**. Both requests run without a login.

| Request | Endpoint | Expected result |
| --- | --- | --- |
| **Check server status** | `GET /api/health` | `200` with `{"status":"ok"}` |
| **Check database connection** | `GET /api/db-test` | `200` with `{"status":"connected"}` or `503` if the running API cannot reach MySQL |

The other folders are **Registration**, **Login**, **Customers**, **Drivers**, **Vehicles**, **Rides**, and **Payments**. **Registration** contains public customer signup. Admins create driver accounts in **Drivers**.

Select **Run collection** to run all folders in the listed order. The collection saves the JWTs and resource IDs during the run. The main login requests use the accounts created by `db:seed`. The runner adds demo rows, including a completed ride and a paid payment record. Keep the exported collection's password and token fields blank when submitting. [Postman Collection Runner documentation](https://learning.postman.com/docs/tests-and-scripts/running-collections/intro-to-collection-runs/intro-to-collection-runs-overview/)

### Test by role

Requests are labeled by the role that sends them. Click **Send** on the matching login first. The login script saves the token for that role, and create requests save the IDs that later requests use.

| Label | What you can try |
| --- | --- |
| **[Public]** | Register a new customer or send **Protected route without token** to see HTTP 401. The registration example generates an email and phone each time you send it. |
| **[Customer]** | Send **Login as customer**, then **Request ride** and **Read ride**. After the driver completes the ride, send **Create pending payment**. |
| **[Driver]** | After the customer requests a ride, send **Login as driver**, **Find driver demo vehicle**, **List open rides**, **Accept ride**, **Start ride**, and **Complete ride**. |
| **[Admin]** | Send **Login as admin**, then manage customers, drivers and vehicles. Send **Mark payment paid** after the customer creates the pending payment. |

For the manual booking demo, work through Customer request, Driver completion, Customer payment, then Admin confirmation. The collection includes separate requests for expected errors and alternate actions. **Run collection** handles those in the intended order.

### Live demo in six steps

1. Show the output of `npm.cmd run start:dev`, then send both requests in **System Checks**.
2. In **Login**, send **[Admin] Login as admin** and **[Driver] Login as driver**. The second login supplies the driver ID for vehicle CRUD.
3. In **Vehicles**, send the **[Admin]** requests **Create vehicle**, **Read vehicle**, **Update vehicle** and **Delete vehicle**. The expected responses are `201`, `200`, `200` and `204`. Send **Confirm deletion** to see `404`.
4. Trace the create request from [VehiclesController](src/vehicles/vehicles.module.ts) to [VehiclesService](src/vehicles/vehicles.service.ts), then show the [Vehicle entity](src/database/entities.ts) and its repository write. Explain how the saved row becomes a JSON response.
5. In **Login**, send **[Public] Protected route without token** and show `401`.
6. In phpMyAdmin, show the driver and vehicles tables. Refresh the vehicles table after creating or updating the vehicle so you can show the row. After deleting it, refresh again to show its absence. The complete collection also leaves a completed ride and a paid payment for inspection.

For a 5–10 minute video, narrate those steps yourself. The [technical report](docs/Transportayo-Technical-Documentation.pdf) has an editable cover-page field for your shareable recording link. The [presentation slides](docs/Transportayo-Presentation.pptx) follow the live demo order.
