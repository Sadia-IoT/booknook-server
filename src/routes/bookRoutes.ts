import express from "express";
import { getDB } from "../config/db";
import { ObjectId } from "mongodb";

const router = express.Router();


// Get all books (supports limit and email filter)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const email = req.query.email as string;
    const limit = Number(req.query.limit);

    const filter = email ? { userEmail: email } : {};

    let query = db
      .collection("books")
      .find(filter)
      .sort({ createdAt: -1 });

    if (Number.isInteger(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const books = await query.toArray();

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


// Get a single book by ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;



    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await db.collection("books").findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Book fetched successfully",
      data: book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch book",
    });
  }
});
// Add a new book
router.post("/", async (req, res) => {
  try {
    const {
  title,
  author,
  totalCopies,
  availableCopies,
} = req.body;

if (!title || !author || !totalCopies) {
  return res.status(400).json({
    success: false,
    message: "Title, author and total copies are required",
  });
}

if (totalCopies < 1 || availableCopies < 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid book copies",
  });
}
    const db = getDB();

    const bookData = req.body;

    const result = await db.collection("books").insertOne({
      ...bookData,
      totalCopies: Number(bookData.totalCopies),
      availableCopies: Number(bookData.totalCopies),
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add book",
    });
  }
});

// Update a book
router.patch("/:id", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const updatedData = { ...req.body };

    if (updatedData.totalCopies !== undefined) {
      updatedData.totalCopies = Number(updatedData.totalCopies);
    }

    const result = await db.collection("books").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
});


// Delete a book
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const result = await db.collection("books").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
});

// Add multiple books at once
router.post("/bulk", async (req, res) => {
  try {
    const db = getDB();
    const { books } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Books array is required",
      });
    }

    const invalidBook = books.some(
      (book) =>
        !book.title?.trim() ||
        !book.author?.trim() ||
        !Number.isFinite(Number(book.totalCopies)) ||
        Number(book.totalCopies) < 1
    );

    if (invalidBook) {
      return res.status(400).json({
        success: false,
        message: "Invalid book information",
      });
    }

    const booksData = books.map((book) => ({
      ...book,
      totalCopies: Number(book.totalCopies),
      availableCopies: Number(book.totalCopies),
      createdAt: new Date(),
    }));

    const result = await db
      .collection("books")
      .insertMany(booksData);

    res.status(201).json({
      success: true,
      message: "Books added successfully",
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add books",
    });
  }
});

export default router;