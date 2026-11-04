
import dotenv from "dotenv";
dotenv.config();

import app from "./server.js";
import { connectDB } from "./db.js";

const port = Number(process.env.PORT || 5000);

async function startLocalServer() {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required. Add it to server/.env.");
    process.exit(1);
  }

  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`PUGAZH NILA API running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startLocalServer();
