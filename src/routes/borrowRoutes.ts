import express from "express";
import { getDB } from "../config/db";
import { ObjectId } from "mongodb";

const router = express.Router();

// Borrow a book
router.post("/", async (req, res) => {
  try {
    const db = getDB();

    const { bookId, userEmail, borrowDate, returnDate } = req.body;

    if (
      !bookId ||
      !userEmail ||
      !borrowDate ||
      !returnDate
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await db.collection("books").findOne({
      _id: new ObjectId(bookId),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: "No copies available",
      });
    }

    const borrowInfo = {
      bookId: new ObjectId(bookId),
      userEmail,
      borrowDate: new Date(borrowDate),
      returnDate: new Date(returnDate),
      status: "borrowed",
      createdAt: new Date(),
    };

    await db.collection("borrows").insertOne(borrowInfo);

    await db.collection("books").updateOne(
      { _id: new ObjectId(bookId) },
      { $inc: { availableCopies: -1 } }
    );

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to borrow book",
    });
  }
});

export default router;