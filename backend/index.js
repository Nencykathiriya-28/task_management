import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import seedAdmin from "./src/utils/seeder.js";


const PORT = process.env.PORT;

await connectDB();
await seedAdmin();


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});