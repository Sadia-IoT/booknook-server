
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import bookRoutes from "./routes/bookRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/books", bookRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BookNook server is running!",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`BookNook server running on port ${PORT}`);
  });
};

startServer();
