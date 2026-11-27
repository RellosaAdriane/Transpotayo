# Transportayo

Transportayo is the backend prototype for the Web-Based Ride Booking and Transportation Assistance System proposed in Lab 03. It has 26 REST endpoints covering login, customers, drivers, vehicles, rides, and payment records. It uses Node.js, NestJS, TypeORM, MySQL (tested on XAMPP MariaDB), bcrypt and JWT. Postman serves as the client for the demo.

## Run locally on Windows

1. Use Node.js 22 or later. Start **MySQL** in XAMPP. Start **Apache** if you want to open phpMyAdmin.
2. On a fresh checkout, run `npm.cmd ci` and `Copy-Item .env.example .env`. If your folder already has an `.env` and the prototype database, keep them and skip to step 5.
3. In [phpMyAdmin](http://localhost/phpmyadmin), open the server-level **Import** tab and import [database/transportayo.sql](database/transportayo.sql). It creates `transportayo_prototype` and its six tables. Import into an empty schema. `DB_SYNC=false` uses the imported schema.
4. Edit `.env`. Match the host, port, user and password to your local MySQL settings. Use `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` to generate `JWT_SECRET`. Set separate local demo passwords (8 to 72 UTF-8 bytes) for the three `DEMO_*_PASSWORD` fields.
5. Run these commands in the project folder.

   ```powershell
   npm.cmd run db:seed
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

Select **Run collection** to run the requests in the listed order. The collection saves the JWTs and resource IDs during the run. The login requests use the accounts created by `db:seed`. The runner adds demo rows, including a completed ride and a paid payment record. Keep the exported collection's password and token fields blank when submitting. [Postman Collection Runner documentation](https://learning.postman.com/docs/tests-and-scripts/running-collections/intro-to-collection-runs/intro-to-collection-runs-overview/)

### Live demo in six steps

1. Show the output of `npm.cmd run start:dev`.
2. Send **Login as admin** and **Login as driver**. The second login supplies the driver ID for vehicle CRUD.
3. Send **Create vehicle**, **Read vehicle**, **Update vehicle** and **Delete vehicle**. The expected responses are `201`, `200`, `200` and `204`. Send **Confirm deletion** to see `404`.
4. Trace the create request from [VehiclesController](src/vehicles/vehicles.module.ts) to [VehiclesService](src/vehicles/vehicles.service.ts), then show the [Vehicle entity](src/database/entities.ts) and its repository write. Explain how the saved row becomes a JSON response.
5. Send **Protected route without token** and show `401`.
6. In phpMyAdmin, show the driver and vehicles tables. Refresh the vehicles table after creating or updating the vehicle so you can show the row. After deleting it, refresh again to show its absence. The complete collection also leaves a completed ride and a paid payment for inspection.

For a 5–10 minute video, narrate those steps yourself. The [technical report](docs/Transportayo-Technical-Documentation.pdf) has an editable cover-page field for your shareable recording link. The [presentation slides](docs/Transportayo-Presentation.pptx) follow the live demo order.
