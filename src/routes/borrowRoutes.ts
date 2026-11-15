import { verifyToken } from "../middleware/verifyToken";
import express, { type Request } from "express";
import { getDB } from "../config/db";
import { ObjectId } from "mongodb";

const router = express.Router();

router.use(verifyToken);

type AuthUser = {
  email?: string;
  name?: string;
};

const getAuthUser = (req: Request) => {
  return (req as Request & { user?: AuthUser }).user;
};

// Get borrowed books by logged-in user's email
router.get("/", async (req, res) => {
  try {
    const user = getAuthUser(req);

    if (!user?.email) {
      return res.status(401).json({
        success: false,
        message: "User information not found in token",
      });
    }

    const requestedEmail = req.query.email;

    if (
      typeof requestedEmail !== "string" ||
      requestedEmail.toLowerCase() !== user.email.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own borrowed books",
      });
    }

    const db = getDB();

    const borrows = await db
      .collection("borrows")
      .aggregate([
        {
          $match: {
            userEmail: user.email,
            status: "borrowed",
          },
        },
        {
          $lookup: {
            from: "books",
            localField: "bookId",
            foreignField: "_id",
            as: "book",
          },
        },
        {
          $unwind: "$book",
        },
        {
          $addFields: {
            title: "$book.title",
            image: "$book.image",
            author: "$book.author",
          },
        },
        {
          $project: {
            book: 0,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Borrowed books retrieved successfully",
      data: borrows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve borrowed books",
    });
  }
});

// Borrow a book
router.post("/", async (req, res) => {
  try {
    const user = getAuthUser(req);

    if (!user?.email) {
      return res.status(401).json({
        success: false,
        message: "User information not found in token",
      });
    }

    const db = getDB();

    const { bookId, borrowDate, returnDate } = req.body;

    if (!bookId || !borrowDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (typeof bookId !== "string" || !ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const parsedBorrowDate = new Date(borrowDate);
    const parsedReturnDate = new Date(returnDate);

    if (
      Number.isNaN(parsedBorrowDate.getTime()) ||
      Number.isNaN(parsedReturnDate.getTime()) ||
      parsedReturnDate <= parsedBorrowDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid borrow or return date",
      });
    }

    const bookObjectId = new ObjectId(bookId);

    const book = await db.collection("books").findOne({
      _id: bookObjectId,
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check whether this user already borrowed this book
    const existingBorrow = await db.collection("borrows").findOne({
      bookId: bookObjectId,
      userEmail: user.email,
      status: "borrowed",
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: "You have already borrowed this book",
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: "No copies available",
      });
    }

    const borrowInfo = {
      bookId: bookObjectId,
      userEmail: user.email,
      borrowDate: parsedBorrowDate,
      returnDate: parsedReturnDate,
      status: "borrowed",
      createdAt: new Date(),
    };

    await db.collection("borrows").insertOne(borrowInfo);

    await db.collection("books").updateOne(
      { _id: bookObjectId },
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

// Return a borrowed book
router.patch("/:id/return", async (req, res) => {
  try {
    const user = getAuthUser(req);

    if (!user?.email) {
      return res.status(401).json({
        success: false,
        message: "User information not found in token",
      });
    }

    const db = getDB();
    const { id } = req.params;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid borrowing ID",
      });
    }

    const borrowId = new ObjectId(id);

    // Find only this user's active borrowing record
    const existing = await db.collection("borrows").findOne({
      _id: borrowId,
      userEmail: user.email,
      status: "borrowed",
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Borrow record not found or already returned",
      });
    }

    const result = await db.collection("borrows").updateOne(
      {
        _id: borrowId,
        userEmail: user.email,
        status: "borrowed",
      },
      {
        $set: {
          status: "returned",
          returnedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Borrow record not found or already returned",
      });
    }

    // Increase available copies
    await db.collection("books").updateOne(
      { _id: existing.bookId },
      { $inc: { availableCopies: 1 } }
    );

    res.status(200).json({
      success: true,
      message: "Book returned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to return book",
    });
  }
});

export default router;