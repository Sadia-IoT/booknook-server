import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import dotenv from "dotenv";
dotenv.config();
import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.DB_NAME as string;

const client = new MongoClient(uri);

let database: Db;

export const connectDB = async () => {
  try {
    await client.connect();

    database = client.db(dbName);

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export const getDB = () => database;
