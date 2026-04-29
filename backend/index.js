import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import seedAdmin from "./src/utils/seeder.js";


import http from 'http';
import { init } from './src/utils/socket.js';

const PORT = process.env.PORT || 5000;

await connectDB();
await seedAdmin();

const server = http.createServer(app);
init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});