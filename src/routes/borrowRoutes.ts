import { verifyToken } from "../middleware/verifyToken";
import express from "express";
import { getDB } from "../config/db";
import { ObjectId } from "mongodb";

const router = express.Router();
router.use(verifyToken);

// Get borrowed books by user email
router.get("/", async (req, res) => {
    console.log("GET BORROWS ROUTE CALLED");
  try {
    const db = getDB();
    const userEmail = req.query.email as string;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

  const borrows = await db
  .collection("borrows")
  .aggregate([
    {
      $match: {
        userEmail,
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
      console.log("Borrow records:", JSON.stringify(borrows, null, 2));

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
    // Check if this user already borrowed this book
const existingBorrow = await db.collection("borrows").findOne({
  bookId: new ObjectId(bookId),
  userEmail,
  status: "borrowed",
});

if (existingBorrow) {
  return res.status(400).json({
    success: false,
    message: "You have already borrowed this book",
  });
}

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

// Return a borrowed book
router.patch("/:id/return", async (req, res) => {
    console.log("RETURN ROUTE CALLED:", req.params.id);
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid borrowing ID",
      });
    }

    const existing = await db.collection("borrows").findOne({
  _id: new ObjectId(id),
});

console.log("FOUND BORROW:", existing);
console.log("BORROW STATUS:", existing?.status);

    // Find and update the borrowing record
    const result = await db.collection("borrows").updateOne(
      {
        _id: new ObjectId(id),
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
    const borrow = await db.collection("borrows").findOne({
      _id: new ObjectId(id),
    });

    await db.collection("books").updateOne(
      { _id: borrow!.bookId },
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