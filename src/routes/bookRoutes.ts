import express from "express";
import { getDB } from "../config/db";

const router = express.Router();

// Get all books
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const books = await db
      .collection("books")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Books fetched successfully",
      data: books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
});

export default router;